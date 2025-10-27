import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseIndexesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type GetIndexesArgs = {
  schema?: string
}

export const getIndexesSql = ({ schema }: GetIndexesArgs) => {
  const sql = /* SQL */ `
SELECT schemaname as "schema",
  tablename as "table",
  indexname as "name",
  indexdef as "definition"
FROM pg_indexes
WHERE schemaname = '${schema}';
`.trim()

  return sql
}

export type DatabaseIndex = {
  name: string
  schema: string
  table: string
  definition: string
  enabled: boolean
}

export type IndexesVariables = GetIndexesArgs & {
  branch?: Branch
}

export async function getIndexes({ schema, branch }: IndexesVariables, signal?: AbortSignal) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getIndexesSql({ schema })

  const { result } = await executeSql(
    {
      branch,
      sql,
      queryKey: ['indexes', schema],
    },
    signal
  )

  return result as DatabaseIndex[]
}

export type IndexesData = Awaited<ReturnType<typeof getIndexes>>
export type IndexesError = ExecuteSqlError

export const useIndexesQuery = <TData = IndexesData>(
  { branch, schema }: IndexesVariables,
  { enabled = true, ...options }: UseQueryOptions<IndexesData, IndexesError, TData> = {}
) =>
  useQuery<IndexesData, IndexesError, TData>(
    databaseIndexesKeys.list(branch?.organization_id, branch?.project_id, branch?.id, schema),
    ({ signal }) => getIndexes({ branch, schema }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
