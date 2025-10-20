import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useIsLoggedIn } from 'common'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { permissionKeys } from './keys'

export async function getRoles(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/roles', { signal })
  if (error) handleError(error)
  return data
}

export type RolesData = Awaited<ReturnType<typeof getRoles>>
export type RolesError = ResponseError

export const useRolesQuery = <TData = RolesData>({
  enabled = true,
  ...options
}: UseQueryOptions<RolesData, RolesError, TData> = {}) => {
  const isLoggedIn = useIsLoggedIn()

  return useQuery<RolesData, RolesError, TData>(
    permissionKeys.list_roles(),
    ({ signal }) => getRoles(signal),
    {
      ...options,
      enabled: enabled && isLoggedIn,
      staleTime: 5 * 60 * 1000,
    }
  )
}
