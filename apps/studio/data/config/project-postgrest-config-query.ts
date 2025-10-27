import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { configKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type ProjectPostgrestConfigVariables = {
  branch?: Branch
}

type PostgrestConfigResponse = components['schemas']['GetPostgrestConfigResponse'] & {
  db_pool: number | null
}

export async function getProjectPostgrestConfig(
  { branch }: ProjectPostgrestConfigVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/config/postgrest',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
        },
      },
      signal,
    }
  )
  if (error) handleError(error)
  // [Joshen] Not sure why but db_pool isn't part of the API typing
  // https://github.com/supabase/infrastructure/blob/develop/api/src/routes/platform/projects/ref/config/postgrest.dto.ts#L6
  return data as unknown as PostgrestConfigResponse
}

export type ProjectPostgrestConfigData = Awaited<ReturnType<typeof getProjectPostgrestConfig>>
export type ProjectPostgrestConfigError = ResponseError

export const useProjectPostgrestConfigQuery = <TData = ProjectPostgrestConfigData>(
  { branch }: ProjectPostgrestConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData> = {}
) =>
  useQuery<ProjectPostgrestConfigData, ProjectPostgrestConfigError, TData>(
    configKeys.postgrest(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getProjectPostgrestConfig({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
