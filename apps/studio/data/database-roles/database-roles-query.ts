import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { databaseRoleKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseRolesVariables = {
  branch?: Branch
}

export type PgRole = z.infer<typeof pgMeta.roles.zod>

const pgMetaRolesList = pgMeta.roles.list()

export async function getDatabaseRoles({ branch }: DatabaseRolesVariables, signal?: AbortSignal) {
  const { result } = await executeSql(
    {
      branch,
      sql: pgMetaRolesList.sql,
      queryKey: ['database-roles'],
    },
    signal
  )

  return result as PgRole[]
}

export type DatabaseRolesData = z.infer<typeof pgMetaRolesList.zod>
export type DatabaseRolesError = ExecuteSqlError

export const useDatabaseRolesQuery = <TData = DatabaseRolesData>(
  { branch }: DatabaseRolesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseRolesData, DatabaseRolesError, TData> = {}
) =>
  useQuery<DatabaseRolesData, DatabaseRolesError, TData>(
    databaseRoleKeys.databaseRoles(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseRoles({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )

export function invalidateRolesQuery(
  client: QueryClient,
  orgId: string | undefined,
  projectId: string | undefined,
  branchId: string | undefined
) {
  return client.invalidateQueries(databaseRoleKeys.databaseRoles(orgId, projectId, branchId))
}
