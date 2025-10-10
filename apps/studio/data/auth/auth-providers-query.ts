import { get, handleError } from '../fetchers'
import { ResponseError } from 'types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { authKeys } from './keys'

export type AuthProvidersVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function getAuthProviders(
  { orgId, projectId, branchId }: AuthProvidersVariables,
  signal?: AbortSignal
) {
  if (!orgId) throw new Error('orgId is required')
  if (!projectId) throw new Error('projectId is required')
  if (!branchId) throw new Error('branchId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/providers',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type AuthProvidersData = Awaited<ReturnType<typeof getAuthProviders>>
export type AuthProvidersError = ResponseError

export const useAuthProvidersQuery = <TData = AuthProvidersData>(
  { orgId, projectId, branchId }: AuthProvidersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<AuthProvidersData, AuthProvidersError, TData> = {}
) =>
  useQuery<AuthProvidersData, AuthProvidersError, TData>(
    authKeys.authProviders(orgId, projectId, branchId),
    ({ signal }) => getAuthProviders({ orgId, projectId, branchId }, signal),
    {
      enabled:
        enabled &&
        typeof orgId !== 'undefined' &&
        typeof projectId !== 'undefined' &&
        typeof branchId !== 'undefined',
      ...options,
    }
  )
