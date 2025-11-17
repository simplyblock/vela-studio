import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { operations } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { analyticsKeys } from './keys'

export type ProjectLogStatsVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
  interval?: NonNullable<
    operations['UsageApiController_getApiCounts']['parameters']['query']
  >['interval']
}

export type ProjectLogStatsResponse = {
  result: UsageApiCounts[]
}
export interface UsageApiCounts {
  total_auth_requests: number
  total_storage_requests: number
  total_rest_requests: number
  total_realtime_requests: number
  timestamp: string
}

export async function getProjectLogStats(
  { orgRef, projectRef, branchRef, interval }: ProjectLogStatsVariables,
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
  if (!interval) {
    throw new Error('interval is required')
  }

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/usage.api-counts',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
        query: {
          interval,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  return data as unknown as ProjectLogStatsResponse
}

export type ProjectLogStatsData = Awaited<ReturnType<typeof getProjectLogStats>>
export type ProjectLogStatsError = unknown

export const useProjectLogStatsQuery = <TData = ProjectLogStatsData>(
  { orgRef, projectRef, branchRef, interval }: ProjectLogStatsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLogStatsData, ProjectLogStatsError, TData> = {}
) =>
  useQuery<ProjectLogStatsData, ProjectLogStatsError, TData>(
    analyticsKeys.usageApiCounts(orgRef, projectRef, branchRef, interval),
    ({ signal }) => getProjectLogStats({ orgRef, projectRef, branchRef, interval }, signal),
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined' &&
        typeof interval !== 'undefined',
      ...options,
    }
  )

export function prefetchProjectLogStats(
  client: QueryClient,
  { orgRef, projectRef, branchRef, interval }: ProjectLogStatsVariables
) {
  return client.fetchQuery(
    analyticsKeys.usageApiCounts(orgRef, projectRef, branchRef, interval),
    ({ signal }) => getProjectLogStats({ orgRef, projectRef, branchRef, interval }, signal)
  )
}
