import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from './execute-sql-query'
import { sqlKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type OngoingQuery = {
  pid: number
  query: string
  query_start: string
}

export const getOngoingQueriesSql = () => {
  const sql = /* SQL */ `
select pid, query, query_start from pg_stat_activity where state = 'active' and datname = 'postgres';
`.trim()

  return sql
}

export type OngoingQueriesVariables = {
  branch?: Branch
}

export async function getOngoingQueries({ branch }: OngoingQueriesVariables, signal?: AbortSignal) {
  const sql = getOngoingQueriesSql().trim()

  const { result } = await executeSql(
    {
      branch,
      sql,
      queryKey: ['ongoing-queries'],
    },
    signal
  )

  return (result ?? []).filter((x: OngoingQuery) => !x.query.startsWith(sql)) as OngoingQuery[]
}

export type OngoingQueriesData = Awaited<ReturnType<typeof getOngoingQueries>>
export type OngoingQueriesError = ExecuteSqlError

export const useOngoingQueriesQuery = <TData = OngoingQueriesData>(
  { branch }: OngoingQueriesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OngoingQueriesData, OngoingQueriesError, TData> = {}
) =>
  useQuery<OngoingQueriesData, OngoingQueriesError, TData>(
    sqlKeys.ongoingQueries(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getOngoingQueries({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
