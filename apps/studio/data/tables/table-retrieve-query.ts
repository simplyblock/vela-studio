import pgMeta from '@supabase/pg-meta'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type TablesVariables = {
  branch: Branch
  name: string
  schema: string
}

export async function getTable({ branch, name, schema }: TablesVariables, signal?: AbortSignal) {
  const { sql, zod } = pgMeta.tables.retrieve({ name, schema })

  const { result } = await executeSql(
    {
      branch,
      sql,
      queryKey: tableKeys.retrieve(
        branch.organization_id,
        branch.project_id,
        branch.id,
        name,
        schema
      ),
    },
    signal
  )
  return zod.parse(result[0])
}

export type RetrieveTableResult = Awaited<ReturnType<typeof getTable>>
export type RetrieveTableError = ResponseError
export type RetrievedTableColumn = NonNullable<RetrieveTableResult['columns']>[number]

export const useTablesQuery = <TData = RetrieveTableResult>(
  { branch, name, schema }: TablesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<RetrieveTableResult, RetrieveTableError, TData> = {}
) => {
  return useQuery<RetrieveTableResult, RetrieveTableError, TData>(
    tableKeys.retrieve(branch.organization_id, branch.project_id, branch.id, name, schema),
    ({ signal }) => getTable({ branch, name, schema }, signal),
    { enabled: enabled && typeof branch !== 'undefined', ...options }
  )
}
