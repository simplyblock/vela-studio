import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { authKeys } from './keys'
import { Branch } from 'api-types/types'
import { get, handleError } from '../fetchers'

export type Filter = 'verified' | 'unverified' | 'anonymous'

export type UsersVariables = {
  branch?: Branch
  page?: number
  keywords?: string
  filter?: Filter
  providers?: string[]
  sort?: 'created_at' | 'email' | 'phone' | 'last_sign_in_at'
  order?: 'asc' | 'desc'
}

export const USERS_PAGE_LIMIT = 50
export type User = components['schemas']['AuthUserResponse']

const getBranchUsers = async ({ branch }: UsersVariables, signal?: AbortSignal) => {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
      },
      signal,
    },
  )

  if (error) handleError(error)

  return { result: data } as UsersData
}

export type UsersData = { result: User[] }
export type UsersError = ExecuteSqlError

export const useUsersInfiniteQuery = <TData = UsersData>(
  { branch, keywords, filter, providers, sort, order }: UsersVariables,
  { enabled = true, ...options }: UseInfiniteQueryOptions<UsersData, UsersError, TData> = {}
) => {
  const isActive = branch?.status === 'ACTIVE_HEALTHY'

  return useInfiniteQuery<UsersData, UsersError, TData>(
    authKeys.usersInfinite(branch?.organization_id, branch?.project_id, branch?.id, {
      keywords,
      filter,
      providers,
      sort,
      order,
    }),
    ({ signal, pageParam }) => {
      return getBranchUsers({ branch, page: pageParam }, signal)
    },
    {
      enabled: enabled && typeof branch !== 'undefined' && isActive,
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const hasNextPage = lastPage.result.length >= USERS_PAGE_LIMIT
        if (!hasNextPage) return undefined
        return page
      },
      ...options,
    }
  )
}
