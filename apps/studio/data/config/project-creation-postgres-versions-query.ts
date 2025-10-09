import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectCreationPostgresVersionsVariables = {
  dbRegion: string
  organizationSlug: string | undefined
}

export async function getPostgresCreationVersions(
  { dbRegion, organizationSlug }: ProjectCreationPostgresVersionsVariables,
  signal?: AbortSignal
) {
  if (!organizationSlug) throw new Error('organizationSlug is required')

  const { data, error } = await post('/platform/organizations/{slug}/available-versions', {
    params: { path: { slug: organizationSlug } },
    body: { region: dbRegion },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectCreationPostgresVersionData = Awaited<
  ReturnType<typeof getPostgresCreationVersions>
>
export type ProjectCreationPostgresVersionError = ResponseError

export const useProjectCreationPostgresVersionsQuery = <TData = ProjectCreationPostgresVersionData>(
  { dbRegion, organizationSlug }: ProjectCreationPostgresVersionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    ProjectCreationPostgresVersionData,
    ProjectCreationPostgresVersionError,
    TData
  > = {}
) => {
  return useQuery<ProjectCreationPostgresVersionData, ProjectCreationPostgresVersionError, TData>(
    configKeys.projectCreationPostgresVersions(organizationSlug, dbRegion),
    ({ signal }) =>
      getPostgresCreationVersions({ organizationSlug, dbRegion }, signal),
    {
      enabled:
        enabled &&
        typeof organizationSlug !== 'undefined' &&
        organizationSlug !== '_' &&
        typeof dbRegion !== 'undefined',
      ...options,
    }
  )
}
