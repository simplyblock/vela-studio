import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type FunctionsResourceUsageVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
  functionId?: string
  interval?: operations['FunctionResourceLogsController_getStatus']['parameters']['query']['interval']
}

export type FunctionsResourceUsageResponse = any

export async function getFunctionsResourceUsage(
  { orgRef, projectRef, branchRef, functionId, interval }: FunctionsResourceUsageVariables,
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
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/functions.resource-usage',
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

export type FunctionsResourceUsageData = Awaited<ReturnType<typeof getFunctionsResourceUsage>>
export type FunctionsResourceUsageError = unknown

export const useFunctionsResourceUsageQuery = <TData = FunctionsResourceUsageData>(
  { orgRef, projectRef, branchRef, functionId, interval }: FunctionsResourceUsageVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<FunctionsResourceUsageData, FunctionsResourceUsageError, TData> = {}
) =>
  useQuery<FunctionsResourceUsageData, FunctionsResourceUsageError, TData>(
    analyticsKeys.functionsResourceUsage(orgRef, projectRef, branchRef, { functionId, interval }),
    ({ signal }) => getFunctionsResourceUsage({ orgRef, projectRef, branchRef, functionId, interval }, signal),
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
