import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type FunctionsReqStatsVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
  functionId?: string
  interval?: operations['FunctionRequestLogsController_getStatus']['parameters']['query']['interval']
}

export type FunctionsReqStatsResponse = any

export async function getFunctionsReqStats(
  { orgRef, projectRef, branchRef, functionId, interval }: FunctionsReqStatsVariables,
  signal?: AbortSignal
) {
  if (!orgRef) {
    throw new Error('orgRef is required')
  }
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!branchRef) {
    throw new Error('branchRef is required')
  }
  if (!functionId) {
    throw new Error('functionId is required')
  }
  if (!interval) {
    throw new Error('interval is required')
  }

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/functions.req-stats',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
        query: {
          function_id: functionId,
          interval,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  return data
}

export type FunctionsReqStatsData = Awaited<ReturnType<typeof getFunctionsReqStats>>
export type FunctionsReqStatsError = unknown

export const useFunctionsReqStatsQuery = <TData = FunctionsReqStatsData>(
  { orgRef, projectRef, branchRef, functionId, interval }: FunctionsReqStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsReqStatsData, FunctionsReqStatsError, TData> = {}
) =>
  useQuery<FunctionsReqStatsData, FunctionsReqStatsError, TData>(
    analyticsKeys.functionsReqStats(orgRef, projectRef, branchRef, { functionId, interval }),
    ({ signal }) => getFunctionsReqStats({ orgRef, projectRef, branchRef, functionId, interval }, signal),
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined' &&
        typeof functionId !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )
