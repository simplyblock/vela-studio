import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { Branch } from 'api-types/types'

export type DatabasePublicationsVariables = {
  branch?: Branch
}

export async function getDatabasePublications(
  { branch }: DatabasePublicationsVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/publications', {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabasePublicationsData = Awaited<ReturnType<typeof getDatabasePublications>>
export type DatabasePublicationsError = ResponseError

export const useDatabasePublicationsQuery = <TData = DatabasePublicationsData>(
  { branch }: DatabasePublicationsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabasePublicationsData, DatabasePublicationsError, TData> = {}
) =>
  useQuery<DatabasePublicationsData, DatabasePublicationsError, TData>(
    databasePublicationsKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabasePublications({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
