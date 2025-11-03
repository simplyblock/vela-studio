import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type BranchesVariables = {
  orgRef?: string
  projectRef?: string
}

export async function getBranches(
  { orgRef, projectRef }: BranchesVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/branches`, {
    params: {
      path: {
        slug: orgRef,
        ref: projectRef,
      },
    },
    signal,
  })

  if (error) {
    if ((error as unknown as ResponseError).message === 'Preview branching is not enabled for this project.') {
      return []
    } else {
      handleError(error)
    }
  }

  return data as unknown as BranchesData
}

export type BranchesData = Branch[]
export type BranchesError = ResponseError

export const useBranchesQuery = <TData = BranchesData>(
  { orgRef, projectRef }: BranchesVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData> = {}
) =>
  useQuery<BranchesData, BranchesError, TData>(
    branchKeys.list(orgRef, projectRef),
    ({ signal }) => getBranches({ orgRef: orgRef, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined', ...options }
  )
