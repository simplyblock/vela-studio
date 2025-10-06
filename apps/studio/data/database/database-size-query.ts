import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'
import { Branch } from 'api-types/types'

export const getDatabaseSizeSql = () => {
  const sql = /* SQL */ `
select sum(pg_database_size(pg_database.datname))::bigint as db_size from pg_database;
`.trim()

  return sql
}

export type DatabaseSizeVariables = {
  branch?: Branch
}

export async function getDatabaseSize({ branch }: DatabaseSizeVariables, signal?: AbortSignal) {
  const sql = getDatabaseSizeSql()

  const { result } = await executeSql(
    {
      branch,
      sql,
      queryKey: ['database-size'],
    },
    signal
  )

  const dbSize = result?.[0]?.db_size
  if (typeof dbSize !== 'number') {
    throw new Error('Error fetching dbSize')
  }

  return dbSize
}

export type DatabaseSizeData = Awaited<ReturnType<typeof getDatabaseSize>>
export type DatabaseSizeError = ExecuteSqlError

export const useDatabaseSizeQuery = <TData = DatabaseSizeData>(
  { branch }: DatabaseSizeVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseSizeData, DatabaseSizeError, TData> = {}
) =>
  useQuery<DatabaseSizeData, DatabaseSizeError, TData>(
    databaseKeys.databaseSize(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseSize({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
