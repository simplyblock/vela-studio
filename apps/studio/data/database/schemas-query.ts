import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { databaseKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type SchemasVariables = {
  branch?: Branch
}

export type Schema = z.infer<typeof pgMeta.schemas.zod>

const pgMetaSchemasList = pgMeta.schemas.list()

export type SchemasData = z.infer<typeof pgMetaSchemasList.zod>
export type SchemasError = ExecuteSqlError

export async function getSchemas({ branch }: SchemasVariables, signal?: AbortSignal) {
  const { result } = await executeSql(
    {
      branch,
      sql: pgMetaSchemasList.sql,
      queryKey: ['schemas'],
    },
    signal
  )

  return result
}

export const useSchemasQuery = <TData = SchemasData>(
  { branch }: SchemasVariables,
  { enabled = true, ...options }: UseQueryOptions<SchemasData, SchemasError, TData> = {}
) =>
  useQuery<SchemasData, SchemasError, TData>(
    databaseKeys.schemas(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getSchemas({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )

export function invalidateSchemasQuery(
  client: QueryClient,
  orgId: string | undefined,
  projectId: string | undefined,
  branchId: string | undefined
) {
  return client.invalidateQueries(databaseKeys.schemas(orgId, projectId, branchId))
}

export function prefetchSchemas(client: QueryClient, { branch }: SchemasVariables) {
  return client.fetchQuery(
    databaseKeys.schemas(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getSchemas({ branch }, signal)
  )
}
