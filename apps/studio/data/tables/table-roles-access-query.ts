import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type TableRolesAccessArgs = {
  schema: string
  table: string
}

/**
 * [Joshen] Specifically just checking for anon and authenticated roles since this is
 * just to verify if the table is exposed via the VelaAPI
 */
export const getTableRolesAccessSql = ({ schema, table }: TableRolesAccessArgs) => {
  const sql = /* SQL */ `
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = '${schema}'
  AND table_name = '${table}'
  AND grantee IN ('anon', 'authenticated');
`.trim()

  return sql
}

export type TableRolesAccessVariables = TableRolesAccessArgs & {
  branch?: Branch
}

export async function getTableRolesAccess(
  { schema, table, branch }: TableRolesAccessVariables,
  signal?: AbortSignal
) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getTableRolesAccessSql({ schema, table })

  const { result } = (await executeSql(
    { branch, sql, queryKey: ['TableRolesAccess', schema] },
    signal
  )) as { result: { grantee: string; privilege_type: string }[] }

  const res = []
  if (result.some((x) => x.grantee === 'anon')) res.push('anon')
  if (result.some((x) => x.grantee === 'authenticated')) res.push('authenticated')

  return res
}

export type TableRolesAccessData = Awaited<ReturnType<typeof getTableRolesAccess>>
export type TableRolesAccessError = ExecuteSqlError

export const useTableRolesAccessQuery = <TData = TableRolesAccessData>(
  { branch, schema, table }: TableRolesAccessVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableRolesAccessData, TableRolesAccessError, TData> = {}
) =>
  useQuery<TableRolesAccessData, TableRolesAccessError, TData>(
    tableKeys.rolesAccess(branch?.organization_id, branch?.project_id, branch?.id, schema, table),
    ({ signal }) => getTableRolesAccess({ branch, schema, table }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
