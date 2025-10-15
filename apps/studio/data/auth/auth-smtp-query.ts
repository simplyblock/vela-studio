import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useCallback } from 'react'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { AuthVariables } from './types'

export async function getBranchAuthSMTP(
  { orgId, projectId, branchId }: AuthVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/smtp', {
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

export type BranchAuthSMTPData = Awaited<ReturnType<typeof getBranchAuthSMTP>>
export type BranchAuthSMTPError = ResponseError

export const useAuthSMTPQuery = <TData = BranchAuthSMTPData>(
  { orgId, projectId, branchId }: AuthVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<BranchAuthSMTPData, BranchAuthSMTPError, TData> = {}
) =>
  useQuery<BranchAuthSMTPData, BranchAuthSMTPError, TData>(
    authKeys.authSMTP(orgId, projectId, branchId),
    ({ signal }) => getBranchAuthSMTP({ orgId, projectId, branchId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined' && typeof projectId !== 'undefined' && typeof branchId !== 'undefined',
      ...options,
    }
  )

export const useAuthSMTPPrefetch = ({ orgId, projectId, branchId }: AuthVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectId) {
      client.prefetchQuery(authKeys.authSMTP(orgId, projectId, branchId), ({ signal }) =>
        getBranchAuthSMTP({ orgId, projectId, branchId }, signal)
      )
    }
  }, [client, orgId, projectId, branchId])
}
