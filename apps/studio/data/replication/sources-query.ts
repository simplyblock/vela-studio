import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationSourcesParams = {
  orgSlug?: string,
  projectRef?: string
}

async function fetchReplicationSources(
  { orgSlug, projectRef }: ReplicationSourcesParams,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/replication/sources', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSourcesData = Awaited<ReturnType<typeof fetchReplicationSources>>

export const useReplicationSourcesQuery = <TData = ReplicationSourcesData>(
  { orgSlug, projectRef }: ReplicationSourcesParams,
  { enabled = true, ...options }: UseQueryOptions<ReplicationSourcesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSourcesData, ResponseError, TData>(
    replicationKeys.sources(orgSlug, projectRef),
    ({ signal }) => fetchReplicationSources({ orgRef: orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined', ...options }
  )
