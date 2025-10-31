import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type OrgProjectsVariables = {
  orgRef?: string
}

export type OrgProjectsResponse = components['schemas']['OrganizationProjectsResponse']

export async function getOrgProjects(
  { orgRef }: OrgProjectsVariables,
  signal?: AbortSignal
): Promise<OrgProjectsResponse> {
  if (!orgRef) throw new Error('orgRef is required')
  const { data, error } = await get(`/platform/organizations/{slug}/org-projects`, {
    params: {
      path: {
        slug: orgRef,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgProjectsData = Awaited<ReturnType<typeof getOrgProjects>>
export type OrgProjectsError = ResponseError

export const useOrgProjectsQuery = <TData = OrgProjectsData>(
  { orgRef }: OrgProjectsVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgProjectsData, OrgProjectsError, TData> = {}
) =>
  useQuery<OrgProjectsData, OrgProjectsError, TData>(
    projectKeys.orgProjects(orgRef),
    ({ signal }) => getOrgProjects({ orgRef }, signal),
    {
      enabled: enabled && typeof orgRef !== 'undefined',
      ...options,
    }
  )
