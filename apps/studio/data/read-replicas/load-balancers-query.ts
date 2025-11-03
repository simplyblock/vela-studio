import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'

export type LoadBalancersVariables = {
  orgRef?: string
  projectRef?: string
}

export type LoadBalancer = components['schemas']['LoadBalancerDetailResponse']

export async function getLoadBalancers(
  { projectRef, orgRef }: LoadBalancersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  if (!orgRef) throw new Error('Organization slug is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/load-balancers`,
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

  if (error) handleError(error)
  return data
}

export type LoadBalancersData = Awaited<ReturnType<typeof getLoadBalancers>>
export type LoadBalancersError = ResponseError

export const useLoadBalancersQuery = <TData = LoadBalancersData>(
  { projectRef, orgRef }: LoadBalancersVariables,
  { enabled = true, ...options }: UseQueryOptions<LoadBalancersData, LoadBalancersError, TData> = {}
) => {
  return useQuery<LoadBalancersData, LoadBalancersError, TData>(
    replicaKeys.loadBalancers(projectRef),
    ({ signal }) => getLoadBalancers({ projectRef, orgRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined',
      ...options,
    }
  )
}
