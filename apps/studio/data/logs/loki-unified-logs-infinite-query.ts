import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import {
  PageParam,
  QuerySearchParamsType,
} from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { logsKeys } from './keys'

const logNameMapping: { [key: string]: string } = {
  storage: 'vela-storage',
  'edge function': 'vela-edge-functions',
  auth: 'vela-keycloak',
  postgrest: 'vela-rest',
  postgres: 'vela-db',
}

const getLogName = (logType: string) => logNameMapping[logType] || logType

const getLogTypeQuery = (search: QuerySearchParamsType) => {
  if (search.log_type && search.log_type.length > 0) {
    const types = search.log_type.map((logType) => getLogName(logType)).join('|')
    return `appname=~"${types}"`
  }
  return undefined
}

const getStatusQuery = (search: QuerySearchParamsType) => {
  if (search.status && search.status.length > 0) {
    const statuses = search.status.map((status) => `${status}`).join('|')
    return `status=~"${statuses}"`
  }
  return undefined
}

const getMethodQuery = (search: QuerySearchParamsType) => {
  if (search.method && search.method.length > 0) {
    const methods = search.method.map((method) => `${method}`).join('|')
    return `method=~"${methods}"`
  }
  return undefined
}

const getLevelQuery = (search: QuerySearchParamsType) => {
  if (search.level && search.level.length > 0) {
    const levels = search.level.map((level) => `${level}`).join('|')
    return `level=~"${levels}"`
  }
  return undefined
}

// TODO @Chris: Move query building to BE (loki.ts)
const getUnifiedLogsQuery = (search: QuerySearchParamsType, branchRef: string) => {
  const typesQuery = getLogTypeQuery(search)
  const statusQuery = getStatusQuery(search)
  const methodQuery = getMethodQuery(search)
  const levelQuery = getLevelQuery(search)

  const queryParts = [typesQuery, statusQuery, methodQuery, levelQuery]
    .filter((item) => item !== undefined)
    .join(',')

  const query = `{branch_id="${branchRef}"${queryParts.length > 0 ? ',' + queryParts : ''}} | json`
  // TODO @Chris: Do we have more elements to add to the query?
  return query
}

const LOGS_PAGE_LIMIT = 100
type LogLevel = 'success' | 'warning' | 'error'

export const UNIFIED_LOGS_QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchInterval: 0,
  staleTime: 1000 * 60 * 5, // 5 minutes,
}

export type UnifiedLogsData = any
export type UnifiedLogsError = ResponseError
export type UnifiedLogsVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
  search: QuerySearchParamsType
}

export const getUnifiedLogsISOStartEnd = (
  search: QuerySearchParamsType,
  endHoursFromNow: number = 1
) => {
  // Extract date range from search or use default (last hour)
  let isoTimestampStart: string
  let isoTimestampEnd: string

  if (search.date && search.date.length === 2) {
    console.log(search.date)
    const parseDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))
    console.log(parseDate(search.date[0]))
    isoTimestampStart = parseDate(search.date[0]).toISOString()
    isoTimestampEnd = parseDate(search.date[1]).toISOString()
  } else {
    const now = new Date()
    isoTimestampEnd = now.toISOString()
    const nHoursAgo = new Date(now.getTime() - 60 * 60 * (endHoursFromNow * 1000))
    isoTimestampStart = nHoursAgo.toISOString()
  }

  return { isoTimestampStart, isoTimestampEnd }
}

export async function getUnifiedLogs(
  {
    orgRef,
    projectRef,
    branchRef,
    search,
    pageParam,
  }: UnifiedLogsVariables & { pageParam?: PageParam },
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (typeof orgRef === 'undefined') throw new Error('orgRef is required')
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof branchRef === 'undefined') throw new Error('branchRef is required')
  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  const cursorValue = pageParam?.cursor
  const cursorDirection = pageParam?.direction

  const query = getUnifiedLogsQuery(search, branchRef)

  let timestampStart: string
  let timestampEnd: string

  if (cursorDirection === 'prev') {
    // Live mode: fetch logs newer than the cursor
    timestampStart = cursorValue ? new Date(Number(cursorValue)).toISOString() : isoTimestampStart
    timestampEnd = new Date().toISOString()
  } else if (cursorDirection === 'next') {
    // Regular pagination: fetch logs older than the cursor
    timestampStart = isoTimestampStart
    timestampEnd = cursorValue ? new Date(Number(cursorValue)).toISOString() : isoTimestampEnd
  } else {
    timestampStart = isoTimestampStart
    timestampEnd = isoTimestampEnd
  }

  let headers = new Headers(headersInit)

  const { data, error } = await post(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/loki`,
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: timestampEnd, query },
      signal,
      headers,
    }
  )

  if (error) handleError(error)

  const resultData = data?.data.result ?? []

  const result = resultData
    .map((row: any, index: number) => {
      // Create a date object for display purposes
      const date = new Date(Number(row.values[0][0]) / 1000 / 1000)

      return {
        id: row.stream?.metadata_id ?? index,
        date,
        timestamp: row.values[0][0],
        level: row.stream.detected_level as LogLevel,
        status: row.status || 200,
        method: row.method,
        host: row.host,
        pathname: (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.pathname || '',
        event_message: row.stream.event_message || row.body || '',
        headers:
          typeof row.headers === 'string' ? JSON.parse(row.headers || '{}') : row.headers || {},
        regions: row.region ? [row.region] : [],
        log_type: !row.stream.level || row.stream.level === '<null>' ? '' : row.stream.level,
        latency: row.latency || 0,
        log_count: row.log_count || null,
        logs: row.logs || [],
        auth_user: row.auth_user || null,
      }
    })
    .sort((a: any, b: any) => b.timestamp - a.timestamp)

  const firstRow = result.length > 0 ? result[result.length - 1] : null
  const lastRow = result.length > 0 ? result[0] : null
  const hasMore = (data?.data.stats.summary.totalPostFilterLines ?? 0) >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.timestamp / 1000 / 1000 : null
  // FIXED: Always provide prevCursor like DataTableDemo does
  // This ensures live mode never breaks the infinite query chain
  // DataTableDemo uses milliseconds, but our timestamps are in microseconds
  const prevCursor =
    result.length > 0 ? firstRow!.timestamp / 1000 / 1000 : new Date().getTime() * 1000

  return {
    data: result,
    nextCursor: hasMore ? nextCursor : null,
    prevCursor,
  }
}

export const useUnifiedLogsInfiniteQuery = <TData = UnifiedLogsData>(
  { orgRef, projectRef, branchRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<UnifiedLogsData, UnifiedLogsError, TData> = {}
) => {
  return useInfiniteQuery<UnifiedLogsData, UnifiedLogsError, TData>(
    logsKeys.unifiedLogsInfinite(orgRef, projectRef, branchRef, search),
    ({ signal, pageParam }) => {
      return getUnifiedLogs({ orgRef, projectRef, branchRef, search, pageParam }, signal)
    },
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      keepPreviousData: true,
      getPreviousPageParam: (firstPage) => {
        if (!firstPage.prevCursor) return null
        const result = { cursor: firstPage.prevCursor, direction: 'prev' }
        return result
      },
      getNextPageParam(lastPage) {
        if (!lastPage.nextCursor || lastPage.data.length === 0) return null
        return { cursor: lastPage.nextCursor, direction: 'next' }
      },
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
}
