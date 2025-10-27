import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { PostgresMaterializedView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { materializedViewKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type MaterializedViewsVariables = {
  branch?: Branch
  schema?: string
}

export async function getMaterializedViews(
  { branch, schema }: MaterializedViewsVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/materialized-views',
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
  return data as PostgresMaterializedView[]
}

export type MaterializedViewsData = Awaited<ReturnType<typeof getMaterializedViews>>
export type MaterializedViewsError = ResponseError

export const useMaterializedViewsQuery = <TData = MaterializedViewsData>(
  { branch, schema }: MaterializedViewsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<MaterializedViewsData, MaterializedViewsError, TData> = {}
) =>
  useQuery<MaterializedViewsData, MaterializedViewsError, TData>(
    schema
      ? materializedViewKeys.listBySchema(
          branch?.organization_id,
          branch?.project_id,
          branch?.id,
          schema
        )
      : materializedViewKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getMaterializedViews({ branch, schema }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      // We're using a staleTime of 0 here because the only way to create a
      // materialized view is via SQL, which we don't know about
      staleTime: 0,
      ...options,
    }
  )
