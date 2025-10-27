import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseExtension = components['schemas']['PostgresExtension']

export type DatabaseExtensionsVariables = {
  branch?: Branch
  connectionString?: string | null
}

export async function getDatabaseExtensions(
  { branch }: DatabaseExtensionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!branch) throw new Error('branch is required')

  let headers = new Headers(headersInit)

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/extensions', {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id
      },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabaseExtensionsData = Awaited<ReturnType<typeof getDatabaseExtensions>>
export type DatabaseExtensionsError = ResponseError

export const useDatabaseExtensionsQuery = <TData = DatabaseExtensionsData>(
  { branch }: DatabaseExtensionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseExtensionsData, DatabaseExtensionsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DatabaseExtensionsData, DatabaseExtensionsError, TData>(
    databaseExtensionsKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseExtensions({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && isActive,
      ...options,
    }
  )
}
