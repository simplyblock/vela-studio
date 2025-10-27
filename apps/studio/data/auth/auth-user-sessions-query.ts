import { Branch } from 'data/branches/branch-query'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { authKeys } from './keys'
import { ResponseError } from '../../types'
import { get, handleError } from '../fetchers'
import { components } from 'api-types'

interface AuthUserSessionsVariables {
  branch?: Branch
  userId: string
}

const getAuthUserSessions = async (
  { branch, userId }: AuthUserSessionsVariables,
  signal?: AbortSignal
) => {
  if (!branch) throw new Error('Branch is required')
  if (!userId) throw new Error('userId is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/{id}/sessions', {
    params: {
      path: {
        slug: branch?.organization_id,
        ref: branch?.project_id,
        branch: branch?.id,
        id: userId,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type AuthUserSessionsData = components['schemas']['AuthUserSessionResponse'][]
export type AuthUserSessionsError = ResponseError

export function useAuthUserSessions<TData = AuthUserSessionsData>(
  { branch, userId }: AuthUserSessionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<AuthUserSessionsData, AuthUserSessionsError, TData> = {}
) {
  return useQuery<AuthUserSessionsData, AuthUserSessionsError, TData>(
    authKeys.userSessions(branch?.organization_id, branch?.project_id, branch?.id, userId),
    ({ signal }) => getAuthUserSessions({ branch, userId }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
}
