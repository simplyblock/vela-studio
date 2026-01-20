import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { FacetMetadataSchema } from 'components/interfaces/UnifiedLogs/UnifiedLogs.schema'
import { handleError, post } from 'data/fetchers'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { logsKeys } from './keys'
import {
  getUnifiedLogsISOStartEnd,
  UNIFIED_LOGS_QUERY_OPTIONS,
  UnifiedLogsVariables,
} from './unified-logs-infinite-query'
import { getUnifiedLogsCountsQuery } from './query-builder'

export async function getUnifiedLogsCount(
  { orgRef, projectRef, branchRef, search }: UnifiedLogsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (typeof orgRef === 'undefined') {
    throw new Error('orgRef is required for getUnifiedLogsCount')
  }
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsCount')
  }
  if (typeof branchRef === 'undefined') {
    throw new Error('branchRef is required for getUnifiedLogsCount')
  }

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  const query = getUnifiedLogsCountsQuery(search, branchRef)

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
      body: {
        iso_timestamp_start: isoTimestampStart,
        iso_timestamp_end: isoTimestampEnd,
        query,
        instant: true,
      },
      signal,
      headers,
    }
  )

  if (error) handleError(error)

  // Process count results into facets structure
  const facets: Record<string, FacetMetadataSchema> = {}
  const countsByDimension: Record<string, Map<string, number>> = {}
  let totalRowCount = 0

  // Group by dimension
  if (data?.data?.result) {
    const result = data.data.result[0] as any | undefined
    totalRowCount = result.value && result.value.length > 1 ? parseInt(result.value[1]) : 0

    data.data.result.forEach((row: any) => {
      const dimension = row.dimension
      const value = row.value
      const count = Number(row.count || 0)

      // Set total count if this is the total dimension
      if (dimension === 'total' && value === 'all') {
        totalRowCount = count
      }

      // Initialize dimension map if not exists
      if (!countsByDimension[dimension]) {
        countsByDimension[dimension] = new Map()
      }

      // Add count to the dimension map
      countsByDimension[dimension].set(value, count)
    })
  }

  // Convert dimension maps to facets structure
  Object.entries(countsByDimension).forEach(([dimension, countsMap]) => {
    // Skip the 'total' dimension as it's not a facet
    if (dimension === 'total') return

    const dimensionTotal = Array.from(countsMap.values()).reduce((sum, count) => sum + count, 0)

    facets[dimension] = {
      total: dimensionTotal,
      rows: Array.from(countsMap.entries()).map(([value, count]) => ({ value, total: count })),
    }
  })

  return { totalRowCount, facets }
}

export type UnifiedLogsCountData = Awaited<ReturnType<typeof getUnifiedLogsCount>>
export type UnifiedLogsCountError = ExecuteSqlError

export const useUnifiedLogsCountQuery = <TData = UnifiedLogsCountData>(
  { orgRef, projectRef, branchRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogsCountData, UnifiedLogsCountError, TData> = {}
) =>
  useQuery<UnifiedLogsCountData, UnifiedLogsCountError, TData>(
    logsKeys.unifiedLogsCount(orgRef, projectRef, branchRef, search),
    ({ signal }) => getUnifiedLogsCount({ orgRef, projectRef, branchRef, search }, signal),
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
