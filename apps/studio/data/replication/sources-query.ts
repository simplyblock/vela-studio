import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationSourcesParams = {
  orgRef?: string
  projectRef?: string
}

async function fetchReplicationSources(
  { orgRef, projectRef }: ReplicationSourcesParams,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/replication/sources',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
        },
      },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSourcesData = Awaited<ReturnType<typeof fetchReplicationSources>>

export const useReplicationSourcesQuery = <TData = ReplicationSourcesData>(
  { orgRef, projectRef }: ReplicationSourcesParams,
  { enabled = true, ...options }: UseQueryOptions<ReplicationSourcesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSourcesData, ResponseError, TData>(
    replicationKeys.sources(orgRef, projectRef),
    ({ signal }) => fetchReplicationSources({ orgRef, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined',
      ...options,
    }
  )
