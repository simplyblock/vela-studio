import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { authKeys } from './keys'
import { Filter } from './users-infinite-query'
import { Branch } from 'api-types/types'
import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'

type UsersCountVariables = {
  branch?: Branch
  keywords?: string
  filter?: Filter
}

const getUsersCount = async (
  { branch, keywords, filter }: UsersCountVariables,
  signal?: AbortSignal
) => {
  if (!branch) throw new Error('branch is required')

  const emailVerified = filter === 'verified' ? true : filter === 'unverified' ? false : undefined

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/count',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: {
          emailVerified,
          q: keywords
        }
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type UsersCountData = Awaited<ReturnType<typeof getUsersCount>>
export type UsersCountError = ResponseError

export const useUsersCountQuery = <TData = UsersCountData>(
  { branch, keywords, filter }: UsersCountVariables,
  { enabled = true, ...options }: UseQueryOptions<UsersCountData, UsersCountError, TData> = {}
) =>
  useQuery<UsersCountData, UsersCountError, TData>(
    authKeys.usersCount(branch?.organization_id, branch?.project_id, branch?.id, {
      filter,
      keywords,
    }),
    ({ signal }) => getUsersCount({ branch, keywords, filter }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
