import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import {
  LogType,
  PageParam,
  QuerySearchParamsType,
} from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'
import { logsKeys } from './keys'
import { getUnifiedLogsQuery } from './query-builder'

const LOGS_PAGE_LIMIT = 100
type LogLevel = 'success' | 'warning' | 'error'

export function appnameToLogType(appname: string): LogType {
  if (appname == 'vela-keycloak' || appname === 'auth') return 'auth'
  if (appname === 'vela-storage' || appname === 'storage') return 'storage'
  // Ebrahim: removed edge-function for now until we have logs for it
  // if (appname === 'vela-edge-functions' || appname === 'edge function') return 'edge-function'
  if (appname === 'vela-rest' || appname === 'postgrest') return 'postgrest'
  if (appname === 'vela-db' || appname === 'postgres') return 'postgres'
  if (appname === 'postgres_exporter') return 'pgexporter'
  if (appname === 'vela-meta') return 'pgmeta'
  return 'other'
}

export function levelToLogLevel(level: string, severity?: string): LogLevel {
  if (severity) return severity as LogLevel
  level = level.toLowerCase()
  if (level === 'info' || level === 'log' || level === 'notice' || level === 'trace')
    return 'success'
  if (level === 'warn' || level === 'warning') return 'warning'
  return 'error'
}

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
    const parseDate = (d: string | Date) => (d instanceof Date ? d : new Date(d))
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
      body: { iso_timestamp_start: timestampStart, iso_timestamp_end: timestampEnd, query },
      signal,
      headers,
    }
  )

  if (error) handleError(error)

  const resultData = data?.data.result ?? []

  const result = resultData
    .flatMap((row: any, index: number) => {
      // Create a date object for display purposes
      return row.values.map((value: any, rowindex: number) => {
        const date = new Date(Number(value[0]) / 1000 / 1000)
        return {
          id: row.stream?.message_id ?? `${index}-${rowindex}`,
          date,
          timestamp: value[0] !== undefined ? parseInt(value[0]) / 1000 / 1000 : undefined,
          level: levelToLogLevel(
            row.stream.level || row.stream.detected_level || 'LOG',
            row.stream.severity
          ),
          log_level: (row.stream.level || row.stream.detected_level || 'LOG').toUpperCase(),
          status: row.status || row.stream.metadata_response_status_code || '',
          method: row.stream.method,
          host: row.stream.host,
          pathname:
            (row.url || row.stream.metadata_request_path || '').replace(/^https?:\/\/[^\/]+/, '') ||
            row.pathname ||
            '',
          event_message: row.stream.message || row.stream.event_message || row.body || '',
          headers:
            typeof row.stream.headers === 'string'
              ? JSON.parse(row.stream.headers || '{}')
              : row.stream.headers || {},
          regions: row.region ? [row.region] : [],
          log_type: appnameToLogType(row.stream.appname),
          latency: row.stream.latency || 0,
          log_count: row.log_count || null,
          logs: row.logs || [],
          auth_user: row.auth_user || null,
          service: row.stream.appname || 'unknown',
        }
      })
    })
    .sort((a: any, b: any) => b.timestamp - a.timestamp)

  const firstRow = result.length > 0 ? result[0] : null
  const lastRow = result.length > 0 ? result[result.length - 1] : null
  const hasMore = (data?.data.stats.summary.totalPostFilterLines ?? 0) >= LOGS_PAGE_LIMIT - 1

  const nextCursor = lastRow ? lastRow.timestamp : null
  // FIXED: Always provide prevCursor like DataTableDemo does
  // This ensures live mode never breaks the infinite query chain
  // DataTableDemo uses milliseconds, but our timestamps are in microseconds
  const prevCursor = result.length > 0 ? firstRow!.timestamp : new Date().getTime()

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
