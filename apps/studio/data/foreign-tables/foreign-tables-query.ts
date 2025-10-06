import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { PostgresView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { foreignTableKeys } from './keys'
import { Branch } from 'api-types/types'

export type ForeignTablesVariables = {
  branch?: Branch
  schema?: string
}

export async function getForeignTables(
  { branch, schema }: ForeignTablesVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/foreign-tables',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: {
          included_schemas: schema || '',
          include_columns: true,
        } as any,
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data as PostgresView[]
}

export type ForeignTablesData = Awaited<ReturnType<typeof getForeignTables>>
export type ForeignTablesError = ResponseError

export const useForeignTablesQuery = <TData = ForeignTablesData>(
  { branch, schema }: ForeignTablesVariables,
  { enabled = true, ...options }: UseQueryOptions<ForeignTablesData, ForeignTablesError, TData> = {}
) =>
  useQuery<ForeignTablesData, ForeignTablesError, TData>(
    schema
      ? foreignTableKeys.listBySchema(branch?.organization_id, branch?.project_id, branch?.id, schema)
      : foreignTableKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getForeignTables({ branch, schema }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
