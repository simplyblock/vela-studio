import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { Branch } from 'api-types/types'

export type BranchesVariables = {
  orgSlug?: string
  projectRef?: string
}

export async function getBranches(
  { orgSlug, projectRef }: BranchesVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/branches`, {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef,
      },
    },
    signal,
  })

  if (error) {
    if ((error as ResponseError).message === 'Preview branching is not enabled for this project.') {
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
  { orgSlug, projectRef }: BranchesVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData> = {}
) =>
  useQuery<BranchesData, BranchesError, TData>(
    branchKeys.list(orgSlug, projectRef),
    ({ signal }) => getBranches({ orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined', ...options }
  )
