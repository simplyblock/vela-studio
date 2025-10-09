import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { Branch } from 'api-types/types'

export type BranchVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export async function getBranch(
  { orgRef, projectRef, branchRef }: BranchVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')
  if (!branchRef) throw new Error('Branch id is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}`,
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
  return data as unknown as BranchData
}

export type BranchData = Branch
export type BranchError = ResponseError

export const useBranchQuery = <TData = BranchData>(
  { orgRef, projectRef, branchRef }: BranchVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchData, BranchError, TData> = {}
) =>
  useQuery<BranchData, BranchError, TData>(
    branchKeys.detail(projectRef, branchRef),
    ({ signal }) => getBranch({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof branchRef !== 'undefined' &&
        typeof projectRef !== 'undefined' &&
        typeof orgRef !== 'undefined',
      ...options,
    }
  )
