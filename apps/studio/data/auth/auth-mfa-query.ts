import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useCallback } from 'react'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthMFAVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function getBranchAuthMFA(
  { orgId, projectId, branchId }: AuthMFAVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/mfa', {
    params: {
      path: {
        slug: orgId!,
        ref: projectId!,
        branch: branchId!
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type BranchAuthMFAData = Awaited<ReturnType<typeof getBranchAuthMFA>>
export type BranchAuthMFAError = ResponseError

export const useAuthMFAQuery = <TData = BranchAuthMFAData>(
  { orgId, projectId, branchId }: AuthMFAVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<BranchAuthMFAData, BranchAuthMFAError, TData> = {}
) =>
  useQuery<BranchAuthMFAData, BranchAuthMFAError, TData>(
    authKeys.authMFA(orgId, projectId, branchId),
    ({ signal }) => getBranchAuthMFA({ orgId, projectId, branchId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined' && typeof projectId !== 'undefined' && typeof branchId !== 'undefined',
      ...options,
    }
  )

export const useAuthMFAPrefetch = ({ orgId, projectId, branchId }: AuthMFAVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectId) {
      client.prefetchQuery(authKeys.authMFA(orgId, projectId, branchId), ({ signal }) =>
        getBranchAuthMFA({ orgId, projectId, branchId }, signal)
      )
    }
  }, [client, orgId, projectId, branchId])
}
