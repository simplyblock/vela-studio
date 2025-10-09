import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'

export type LoadBalancersVariables = {
  orgSlug?: string
  projectRef?: string
}

export type LoadBalancer = components['schemas']['LoadBalancerDetailResponse']

export async function getLoadBalancers(
  { projectRef, orgSlug }: LoadBalancersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!orgSlug) throw new Error('Organization slug is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/load-balancers`, {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef
      }
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type LoadBalancersData = Awaited<ReturnType<typeof getLoadBalancers>>
export type LoadBalancersError = ResponseError

export const useLoadBalancersQuery = <TData = LoadBalancersData>(
  { projectRef, orgSlug }: LoadBalancersVariables,
  { enabled = true, ...options }: UseQueryOptions<LoadBalancersData, LoadBalancersError, TData> = {}
) => {
  return useQuery<LoadBalancersData, LoadBalancersError, TData>(
    replicaKeys.loadBalancers(projectRef),
    ({ signal }) => getLoadBalancers({ projectRef, orgSlug }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
}
