import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useIsLoggedIn } from 'common'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { permissionKeys } from './keys'
import { transformToPermission } from 'hooks/misc/useCheckPermissions'

export async function getPermissions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/profile/permissions', { signal })
  if (error) handleError(error)

  return data.map(item => {
    return {
      organization_id: item.organization_id,
      project_id: item.project_id,
      branch_id: item.branch_id,
      env_type: item.env_type,
      permission: transformToPermission(item.permission),
    }
  })
}

export type PermissionsData = Awaited<ReturnType<typeof getPermissions>>
export type PermissionsError = ResponseError

export const usePermissionsQuery = <TData = PermissionsData>({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, TData> = {}) => {
  const isLoggedIn = useIsLoggedIn()

  return useQuery<PermissionsData, PermissionsError, TData>(
    permissionKeys.list_permissions(),
    ({ signal }) => getPermissions(signal),
    {
      ...options,
      enabled: enabled && isLoggedIn,
      staleTime: 5 * 60 * 1000,
    }
  )
}
