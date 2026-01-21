import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { QuerySearchParamsType } from 'components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import {
  appnameToLogType,
  getUnifiedLogsISOStartEnd,
  levelToLogLevel,
} from './loki-unified-logs-infinite-query'
import { getUnifiedLogsQuery } from './query-builder'

export type getUnifiedLogsVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  search: QuerySearchParamsType
  limit: number
  hoursAgo?: number
}

// [Joshen] Mainly for retrieving logs on demand for downloading
export async function retrieveUnifiedLogs({
  orgRef,
  projectRef,
  branchRef,
  search,
  limit,
  hoursAgo,
}: getUnifiedLogsVariables) {
  if (typeof orgRef === 'undefined') throw new Error('orgRef is required for retrieveUnifiedLogs')
  if (typeof projectRef === 'undefined')
    throw new Error('projectRef is required for retrieveUnifiedLogs')
  if (typeof branchRef === 'undefined')
    throw new Error('branchRef is required for retrieveUnifiedLogs')

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search, hoursAgo)
  const query = getUnifiedLogsQuery(search, branchRef)

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
        limit,
      },
    }
  )

  if (error) handleError(error)

  const resultData = data?.data.result ?? []

  const result = resultData.flatMap((row: any, index: number) => {
    return row.values.map((value: any, rowindex: number) => {
      const date = new Date(Number(value[0]) / 1000 / 1000)
      return {
        id: row.stream.message_id ?? `${index}-${rowindex}`,
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

  return result
}

type LogDrainCreateData = Awaited<ReturnType<typeof retrieveUnifiedLogs>>

export const useGetUnifiedLogsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainCreateData, ResponseError, getUnifiedLogsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<LogDrainCreateData, ResponseError, getUnifiedLogsVariables>(
    (vars) => retrieveUnifiedLogs(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to retrieve logs: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
