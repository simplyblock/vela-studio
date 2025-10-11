import { get, handleError } from '../fetchers'
import { ResponseError } from 'types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { authKeys } from './keys'

export type AuthClientVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function getAuthClient(
  { orgId, projectId, branchId }: AuthClientVariables,
  signal?: AbortSignal
) {
  if (!orgId) throw new Error('orgId is required')
  if (!projectId) throw new Error('projectId is required')
  if (!branchId) throw new Error('branchId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/client',
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

export type AuthClientData = Awaited<ReturnType<typeof getAuthClient>>
export type AuthClientError = ResponseError

export const useAuthClientQuery = <TData = AuthClientData>(
  { orgId, projectId, branchId }: AuthClientVariables,
  { enabled = true, ...options }: UseQueryOptions<AuthClientData, AuthClientError, TData> = {}
) =>
  useQuery<AuthClientData, AuthClientError, TData>(
    authKeys.authProviders(orgId, projectId, branchId),
    ({ signal }) => getAuthClient({ orgId, projectId, branchId }, signal),
    {
      enabled:
        enabled &&
        typeof orgId !== 'undefined' &&
        typeof projectId !== 'undefined' &&
        typeof branchId !== 'undefined',
      ...options,
    }
  )
