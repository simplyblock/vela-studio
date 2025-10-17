import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { permissionKeys } from './keys'

async function getAvailablePermissions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/permissions', { signal })
  if (error) handleError(error)
  return data
}

export type AvailablePermissionsData = Awaited<ReturnType<typeof getAvailablePermissions>>
export type AvailablePermissionsError = ResponseError

export const useAvailablePermissionsQuery = <TData = AvailablePermissionsData>(
  options: UseQueryOptions<AvailablePermissionsData, AvailablePermissionsError, TData> = {}
) =>
  useQuery<AvailablePermissionsData, AvailablePermissionsError, TData>(
    permissionKeys.system_permissions(),
    ({ signal }) => getAvailablePermissions(signal),
    {
      ...options,
      staleTime: Infinity,
    }
  )
