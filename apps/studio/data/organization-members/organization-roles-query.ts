import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationRolesVariables = { slug?: string }
export type OrganizationRolesResponse = components['schemas']['OrganizationRoleResponse']
export type OrganizationRole =
  components['schemas']['OrganizationRoleResponse']['org_scoped_roles'][0]

export async function getOrganizationRoles(
  { slug }: OrganizationRolesVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/roles', {
    params: { path: { slug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

type OrganizationRoles = Awaited<ReturnType<typeof getOrganizationRoles>>

export type OrganizationRolesData = {
  org_scoped_roles: Awaited<ReturnType<typeof getOrganizationRoles>>['links']
  project_scoped_roles: Awaited<ReturnType<typeof getOrganizationRoles>>['links']
}
export type OrganizationRolesError = ResponseError

export const useOrganizationRolesQuery = (
  { slug }: OrganizationRolesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrganizationRoles, OrganizationRolesError, OrganizationRolesData> = {}
) =>
  useQuery<OrganizationRoles, OrganizationRolesError, OrganizationRolesData>(
    organizationKeys.roles(slug),
    ({ signal }) => getOrganizationRoles({ slug }, signal),
    {
      select: (data) => {
        return {
          org_scoped_roles: data.links,
          project_scoped_roles: [],
        } as OrganizationRolesData
      },
      enabled: enabled && typeof slug !== 'undefined',
      ...options,
    }
  )
