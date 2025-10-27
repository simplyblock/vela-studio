import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { PostgresView } from '@supabase/postgres-meta'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { viewKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type ViewsVariables = {
  branch?: Branch
  schema?: string
}

export async function getViews({ branch, schema }: ViewsVariables, signal?: AbortSignal) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/views',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: {
          included_schemas: schema || '',
        } as any,
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data as PostgresView[]
}

export type ViewsData = Awaited<ReturnType<typeof getViews>>
export type ViewsError = ResponseError

export const useViewsQuery = <TData = ViewsData>(
  { branch, schema }: ViewsVariables,
  { enabled = true, ...options }: UseQueryOptions<ViewsData, ViewsError, TData> = {}
) =>
  useQuery<ViewsData, ViewsError, TData>(
    schema
      ? viewKeys.listBySchema(branch?.organization_id, branch?.project_id, branch?.id, schema)
      : viewKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getViews({ branch, schema }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      // We're using a staleTime of 0 here because the only way to create a
      // view is via SQL, which we don't know about
      staleTime: 0,
      ...options,
    }
  )
