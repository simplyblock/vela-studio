import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type ProjectStorageConfigVariables = {
  branch?: Branch
}

export type ProjectStorageConfigResponse = components['schemas']['StorageConfigResponse']

export async function getProjectStorageConfig(
  { branch }: ProjectStorageConfigVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/config/storage',
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
  return data
}

export type ProjectStorageConfigData = Awaited<ReturnType<typeof getProjectStorageConfig>>
export type ProjectStorageConfigError = ResponseError

export const useProjectStorageConfigQuery = <TData = ProjectStorageConfigData>(
  { branch }: ProjectStorageConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectStorageConfigData, ProjectStorageConfigError, TData> = {}
) =>
  useQuery<ProjectStorageConfigData, ProjectStorageConfigError, TData>(
    configKeys.storage(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getProjectStorageConfig({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
