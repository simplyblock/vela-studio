import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { handleError, post } from 'data/fetchers'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { logsKeys } from './keys'
import { UNIFIED_LOGS_QUERY_OPTIONS, UnifiedLogsVariables } from './unified-logs-infinite-query'
import { getUnifiedLogsChartsQuery } from './query-builder'
import { getUnifiedLogsISOStartEnd } from './loki-unified-logs-infinite-query'

export async function getUnifiedLogsChart(
  { orgRef, projectRef, branchRef, search }: UnifiedLogsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (typeof orgRef === 'undefined') {
    throw new Error('orgRef is required for getUnifiedLogsChart')
  }
  if (typeof projectRef === 'undefined') {
    throw new Error('projectRef is required for getUnifiedLogsChart')
  }
  if (typeof branchRef === 'undefined') {
    throw new Error('branchRef is required for getUnifiedLogsChart')
  }

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)

  // Get SQL query from utility function (with dynamic bucketing)
  const query = getUnifiedLogsChartsQuery(search, branchRef)

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
      body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: isoTimestampEnd, query },
      signal,
      headers,
    }
  )

  if (error) handleError(error)

  const chartData: Array<{
    timestamp: number
    success: number
    warning: number
    error: number
  }> = []

  const dataByTimestamp = new Map<
    number,
    {
      timestamp: number
      success: number
      warning: number
      error: number
    }
  >()

  if (data?.data?.result) {
    const timestamps = [
      ...new Set(
        data.data.result.flatMap((metric: any) => metric.values.map((row: any) => row[0] as Number))
      ),
    ].sort((a, b) => a - b)

    const success = data.data.result.find((metric: any) => metric.metric.severity === 'success') as
      | any
      | undefined
    const warning = data.data.result.find((metric: any) => metric.metric.severity === 'warning') as
      | any
      | undefined
    const error = data.data.result.find((metric: any) => metric.metric.severity === 'error') as
      | any
      | undefined

    const entries = timestamps.map((timestamp: number) => {
      const dataPoint = {
        timestamp: timestamp * 1000,
        success: 0,
        warning: 0,
        error: 0,
      }
      if (success) {
        const point = success.values.find((row: any) => row[0] === timestamp)
        if (point) dataPoint.success = parseInt(point[1])
      }
      if (warning) {
        const point = warning.values.find((row: any) => row[0] === timestamp)
        if (point) dataPoint.warning = parseInt(point[1])
      }
      if (error) {
        const point = error.values.find((row: any) => row[0] === timestamp)
        if (point) dataPoint.error = parseInt(point[1])
      }
      return dataPoint
    })

    entries.forEach((entry) => {
      dataByTimestamp.set(entry.timestamp, entry)
    })
  }

  // Determine bucket size based on the truncation level in the SQL query
  // We need to fill in missing data points
  const startTimeMs = new Date(isoTimestampStart).getTime()
  const endTimeMs = new Date(isoTimestampEnd).getTime()

  // Calculate appropriate bucket size from the time range
  const timeRangeHours = (endTimeMs - startTimeMs) / (1000 * 60 * 60)

  let bucketSizeMs: number
  if (timeRangeHours > 72) {
    // Day-level bucketing (for ranges > 3 days)
    bucketSizeMs = 24 * 60 * 60 * 1000
  } else if (timeRangeHours > 12) {
    // Hour-level bucketing (for ranges > 12 hours)
    bucketSizeMs = 60 * 60 * 1000
  } else {
    // Minute-level bucketing (for shorter ranges)
    bucketSizeMs = 60 * 1000
  }

  // Fill in any missing buckets
  for (let t = startTimeMs; t <= endTimeMs; t += bucketSizeMs) {
    // Round to the nearest bucket boundary
    const bucketTime = Math.floor(t / bucketSizeMs) * bucketSizeMs

    if (!dataByTimestamp.has(bucketTime)) {
      // Create empty data point for this bucket
      dataByTimestamp.set(bucketTime, {
        timestamp: bucketTime,
        success: 0,
        warning: 0,
        error: 0,
      })
    }
  }

  // Convert map to array
  for (const dataPoint of dataByTimestamp.values()) {
    chartData.push(dataPoint)
  }

  // Sort by timestamp
  chartData.sort((a, b) => a.timestamp - b.timestamp)

  return chartData
}

export type UnifiedLogsChartData = Awaited<ReturnType<typeof getUnifiedLogsChart>>
export type UnifiedLogsChartError = ExecuteSqlError

export const useUnifiedLogsChartQuery = <TData = UnifiedLogsChartData>(
  { orgRef, projectRef, branchRef, search }: UnifiedLogsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<UnifiedLogsChartData, UnifiedLogsChartError, TData> = {}
) =>
  useQuery<UnifiedLogsChartData, UnifiedLogsChartError, TData>(
    logsKeys.unifiedLogsChart(orgRef, projectRef, branchRef, search),
    ({ signal }) => getUnifiedLogsChart({ orgRef, projectRef, branchRef, search }, signal),
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      keepPreviousData: true,
      ...UNIFIED_LOGS_QUERY_OPTIONS,
      ...options,
    }
  )
