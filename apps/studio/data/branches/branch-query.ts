import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchVariables = {
  orgSlug?: string
  projectRef?: string
  branch?: string
}

export async function getBranch(
  { orgSlug, projectRef, branch }: BranchVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')
  if (!branch) throw new Error('Branch id is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}`,
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
          branch,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type BranchData = Awaited<ReturnType<typeof getBranch>>
export type BranchError = ResponseError

export const useBranchQuery = <TData = BranchData>(
  { orgSlug, projectRef, branch }: BranchVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchData, BranchError, TData> = {}
) =>
  useQuery<BranchData, BranchError, TData>(
    branchKeys.detail(projectRef, branch),
    ({ signal }) => getBranch({ orgSlug, projectRef, branch }, signal),
    {
      enabled:
        enabled &&
        typeof branch !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof orgSlug !== 'undefined',
      ...options,
    }
  )
