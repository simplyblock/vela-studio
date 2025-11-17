import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { analyticsKeys } from './keys'

export type ProjectLogRequestsCountVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export async function getProjectLogRequestsCountStats(
  { orgRef, projectRef, branchRef }: ProjectLogRequestsCountVariables,
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

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/usage.api-requests-count',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type ProjectLogRequestsCountData = Awaited<
  ReturnType<typeof getProjectLogRequestsCountStats>
>
export type ProjectLogRequestsCountError = ResponseError

export const useProjectLogRequestsCountQuery = <TData = ProjectLogRequestsCountData>(
  { orgRef, projectRef, branchRef }: ProjectLogRequestsCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData> = {}
) =>
  useQuery<ProjectLogRequestsCountData, ProjectLogRequestsCountError, TData>(
    analyticsKeys.usageApiRequestsCount(orgRef, projectRef, branchRef),
    ({ signal }) => getProjectLogRequestsCountStats({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof orgRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      ...options,
    }
  )

export function prefetchProjectLogRequestsCount(
  client: QueryClient,
  { orgRef, projectRef, branchRef }: ProjectLogRequestsCountVariables
) {
  return client.fetchQuery(analyticsKeys.usageApiRequestsCount(orgRef, projectRef, branchRef), ({ signal }) =>
    getProjectLogRequestsCountStats({ orgRef, projectRef, branchRef }, signal)
  )
}
