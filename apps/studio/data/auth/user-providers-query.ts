import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { authKeys } from './keys'
import { UserVariables } from './types'
import { Filter } from './users-infinite-query'
import { Branch } from 'data/branches/branch-query'
import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'

const getUserProviders = async (
  { orgId, projectId, branchId, userId }: UserVariables,
  signal?: AbortSignal
) => {
  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/{id}/providers',
    {
      params: {
        path: {
          slug: orgId!,
          ref: projectId!,
          branch: branchId!,
          id: userId!,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  console.log('getUserProviders data:', data, 'type:', typeof data, 'isArray:', Array.isArray(data))
  return data
}

export type UserProvidersData = Awaited<ReturnType<typeof getUserProviders>>
export type UserProvidersError = ResponseError

export const useUserProvidersQuery = <TData = UserProvidersData>(
  vars: UserVariables,
  { enabled = true, ...options }: UseQueryOptions<UserProvidersData, UserProvidersError, TData> = {}
) =>
  useQuery<UserProvidersData, UserProvidersError, TData>(
    authKeys.userProviders(vars.orgId, vars.projectId, vars.branchId, vars.userId),
    ({ signal }) => getUserProviders(vars, signal),
    {
      enabled: enabled && Object.values(vars).every(value => value !== undefined),
      ...options,
    }
  )
