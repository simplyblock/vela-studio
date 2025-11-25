import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type ProjectServiceStatusVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export async function getBranchServiceStatus(
  { orgRef, projectRef, branchRef }: ProjectServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/branch/{branch}/health`,
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef
        },
        query: {
          services: [/*'auth', 'realtime',*/ 'rest', 'storage', 'db'],
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type BranchServiceStatusData = Awaited<ReturnType<typeof getBranchServiceStatus>>
export type BranchServiceStatus = BranchServiceStatusData[0]['status']
export type BranchServiceStatusError = ResponseError

export const useBranchServiceStatusQuery = <TData = BranchServiceStatusData>(
  { orgRef, projectRef, branchRef }: ProjectServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<BranchServiceStatusData, BranchServiceStatusError, TData> = {}
) =>
  useQuery<BranchServiceStatusData, BranchServiceStatusError, TData>(
    serviceStatusKeys.serviceStatus(orgRef, projectRef, branchRef),
    ({ signal }) => getBranchServiceStatus({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof orgRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      ...options,
    }
  )
