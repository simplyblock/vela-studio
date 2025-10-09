import pgMeta from '@supabase/pg-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { z } from 'zod'
import { Branch } from 'api-types/types'

export type DatabaseFunctionsVariables = {
  branch?: Branch
}

export type DatabaseFunction = z.infer<typeof pgMeta.functions.pgFunctionZod>

const pgMetaFunctionsList = pgMeta.functions.list()

export async function getDatabaseFunctions(
  { branch }: DatabaseFunctionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  let headers = new Headers(headersInit)

  const { result } = await executeSql(
    {
      branch,
      sql: pgMetaFunctionsList.sql,
      queryKey: ['database-functions'],
    },
    signal
  )

  return result as DatabaseFunction[]
}

export type DatabaseFunctionsData = z.infer<typeof pgMetaFunctionsList.zod>
export type DatabaseFunctionsError = ResponseError

export const useDatabaseFunctionsQuery = <TData = DatabaseFunctionsData>(
  { branch }: DatabaseFunctionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseFunctionsData, DatabaseFunctionsError, TData> = {}
) =>
  useQuery<DatabaseFunctionsData, DatabaseFunctionsError, TData>(
    databaseKeys.databaseFunctions(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseFunctions({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
