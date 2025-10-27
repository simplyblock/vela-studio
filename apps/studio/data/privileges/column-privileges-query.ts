import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { privilegeKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type ColumnPrivilegesVariables = {
  branch?: Branch
}

export type ColumnPrivilege = components['schemas']['PostgresColumnPrivileges']

export async function getColumnPrivileges(
  { branch }: ColumnPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/column-privileges', {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ColumnPrivilegesData = Awaited<ReturnType<typeof getColumnPrivileges>>
export type ColumnPrivilegesError = ResponseError

export const useColumnPrivilegesQuery = <TData = ColumnPrivilegesData>(
  { branch }: ColumnPrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ColumnPrivilegesData, ColumnPrivilegesError, TData> = {}
) =>
  useQuery<ColumnPrivilegesData, ColumnPrivilegesError, TData>(
    privilegeKeys.columnPrivilegesList(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getColumnPrivileges({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
