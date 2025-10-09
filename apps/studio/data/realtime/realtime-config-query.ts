import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type RealtimeConfigurationVariables = {
  orgId?: string
  projectId?: string
}

export const REALTIME_DEFAULT_CONFIG = {
  private_only: false,
  connection_pool: 2,
  max_concurrent_users: 200,
  max_events_per_second: 100,
  max_bytes_per_second: 100000,
  max_channels_per_client: 100,
  max_joins_per_second: 100,
}

export async function getRealtimeConfiguration(
  { orgId, projectId }: RealtimeConfigurationVariables,
  signal?: AbortSignal
) {
  if (!orgId) throw new Error('Org id is required')
  if (!projectId) throw new Error('Project id is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/config/realtime`,
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
        },
      },
      signal,
    }
  )
  if (error) {
    if ((error as ResponseError).message === 'Custom realtime config for a project not found') {
      return REALTIME_DEFAULT_CONFIG
    } else {
      handleError(error)
    }
  }
  return data
}

export type RealtimeConfigurationData = Awaited<ReturnType<typeof getRealtimeConfiguration>>
export type RealtimeConfigurationError = ResponseError

export const useRealtimeConfigurationQuery = <TData = RealtimeConfigurationData>(
  { orgId, projectId }: RealtimeConfigurationVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<RealtimeConfigurationData, RealtimeConfigurationError, TData> = {}
) =>
  useQuery<RealtimeConfigurationData, RealtimeConfigurationError, TData>(
    realtimeKeys.configuration(projectId),
    ({ signal }) => getRealtimeConfiguration({ orgId, projectId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined' && typeof projectId !== 'undefined',
      ...options,
    }
  )
