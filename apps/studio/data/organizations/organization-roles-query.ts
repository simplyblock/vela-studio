import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { useIsLoggedIn } from 'common'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

type OrganizationRolesProps = {
  slug?: string
}

export async function getOrganizationRoles({ slug }: OrganizationRolesProps, signal?: AbortSignal) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/roles', {
    params: {
      path: {
        slug,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrganizationRolesData = Awaited<ReturnType<typeof getOrganizationRoles>>
export type OrganizationRolesError = ResponseError

export const useOrganizationRolesQuery = <TData = OrganizationRolesData>(
  { slug }: OrganizationRolesProps,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRolesData, OrganizationRolesError, TData> = {}
) => {
  const isLoggedIn = useIsLoggedIn()

  return useQuery<OrganizationRolesData, OrganizationRolesError, TData>(
    organizationKeys.roles(slug),
    ({ signal }) => getOrganizationRoles({ slug }, signal),
    {
      ...options,
      enabled: enabled && isLoggedIn && typeof slug !== 'undefined',
      staleTime: 5 * 60 * 1000,
    }
  )
}
