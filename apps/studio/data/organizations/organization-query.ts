import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationVariables = { slug?: string }

export async function getOrganization({ slug }: OrganizationVariables, signal?: AbortSignal) {
  if (!slug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}', {
    params: { path: { slug } },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrganizationsData = Awaited<ReturnType<typeof getOrganization>>
export type OrganizationsError = ResponseError

export const useOrganizationQuery = <TData = OrganizationsData>(
  { slug }: OrganizationVariables,
  { enabled = true, ...options }: UseQueryOptions<OrganizationsData, OrganizationsError, TData> = {}
) => {
  return useQuery<OrganizationsData, OrganizationsError, TData>(
    organizationKeys.detail(slug),
    ({ signal }) => getOrganization({ slug }, signal),
    { enabled: enabled && typeof slug !== 'undefined', ...options, staleTime: 30 * 60 * 1000 }
  )
}

export function invalidateOrganizationsQuery(client: QueryClient) {
  return client.invalidateQueries(organizationKeys.list())
}
