import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketsVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export type Bucket = components['schemas']['StorageBucketResponse']

export type BucketType = Bucket['type']

export async function getBuckets(
  { orgRef, projectRef, branchRef }: BucketsVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data as Bucket[]
}

export type BucketsData = Awaited<ReturnType<typeof getBuckets>>
export type BucketsError = ResponseError

export const useBucketsQuery = <TData = BucketsData>(
  { orgRef, projectRef, branchRef }: BucketsVariables,
  { enabled = true, ...options }: UseQueryOptions<BucketsData, BucketsError, TData> = {}
) => {
  // FIXME: Bring isActive back
  //const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<BucketsData, BucketsError, TData>(
    storageKeys.buckets(orgRef, projectRef, branchRef),
    ({ signal }) => getBuckets({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof orgRef !== 'undefined' &&
        typeof branchRef !== 'undefined', // && isActive,
      ...options,
      retry: (failureCount, error) => {
        if (
          typeof error === 'object' &&
          error !== null &&
          error.message.startsWith('Tenant config') &&
          error.message.endsWith('not found')
        ) {
          return false
        }

        if (failureCount < 3) {
          return true
        }

        return false
      },
    }
  )
}
