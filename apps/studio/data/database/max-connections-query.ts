import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'
import { Branch } from 'api-types/types'

export const getMaxConnectionsSql = () => {
  const sql = /* SQL */ `show max_connections`

  return sql
}

export type MaxConnectionsVariables = {
  branch?: Branch
  table?: string
  schema?: string
}

export async function getMaxConnections({ branch }: MaxConnectionsVariables, signal?: AbortSignal) {
  const sql = getMaxConnectionsSql()

  const { result } = await executeSql({ branch, sql, queryKey: ['max-connections'] }, signal)

  const connections = parseInt(result[0].max_connections)

  return { maxConnections: connections }
}

export type MaxConnectionsData = Awaited<ReturnType<typeof getMaxConnections>>
export type MaxConnectionsError = ExecuteSqlError

export const useMaxConnectionsQuery = <TData = MaxConnectionsData>(
  { branch }: MaxConnectionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<MaxConnectionsData, MaxConnectionsError, TData> = {}
) =>
  useQuery<MaxConnectionsData, MaxConnectionsError, TData>(
    databaseKeys.maxConnections(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getMaxConnections({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
