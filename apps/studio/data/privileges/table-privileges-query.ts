import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { privilegeKeys } from './keys'
import { Branch } from 'api-types/types'

export type TablePrivilegesVariables = {
  branch?: Branch
}

export type PgTablePrivileges = z.infer<typeof pgMeta.tablePrivileges.zod>

const pgMetaTablePrivilegesList = pgMeta.tablePrivileges.list()

export type TablePrivilegesData = z.infer<typeof pgMetaTablePrivilegesList.zod>
export type TablePrivilegesError = ExecuteSqlError

async function getTablePrivileges({ branch }: TablePrivilegesVariables, signal?: AbortSignal) {
  const { result } = await executeSql(
    {
      branch,
      sql: pgMetaTablePrivilegesList.sql,
      queryKey: ['table-privileges'],
    },
    signal
  )

  return result as TablePrivilegesData
}

export const useTablePrivilegesQuery = <TData = TablePrivilegesData>(
  { branch }: TablePrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TablePrivilegesData, TablePrivilegesError, TData> = {}
) =>
  useQuery<TablePrivilegesData, TablePrivilegesError, TData>(
    privilegeKeys.tablePrivilegesList(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getTablePrivileges({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )

export function invalidateTablePrivilegesQuery(
  client: QueryClient,
  orgId: string | undefined,
  projectId: string | undefined,
  branchId: string | undefined
) {
  return client.invalidateQueries(privilegeKeys.tablePrivilegesList(orgId, projectId, branchId))
}
