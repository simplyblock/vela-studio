import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { usageKeys } from './keys'

export type OrgUsageVariables = {
  orgRef?: string
  projectRef?: string
  start?: Date
  end?: Date
}

export type OrgUsageResponse = components['schemas']['OrgUsageResponse']
export type OrgMetricsUsage = components['schemas']['OrgUsageResponse']['usages'][0]

export async function getOrgUsage(
  { orgRef, projectRef, start, end }: OrgUsageVariables,
  signal?: AbortSignal
): Promise<OrgUsageResponse> {
  if (!orgRef) throw new Error('orgRef is required')
  const { data, error } = await get(`/platform/organizations/{slug}/usage`, {
    params: {
      path: { slug: orgRef },
      query: { project_ref: projectRef, start: start?.toISOString(), end: end?.toISOString() },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgUsageData = Awaited<ReturnType<typeof getOrgUsage>>
export type OrgUsageError = ResponseError

export const useOrgUsageQuery = <TData = OrgUsageData>(
  { orgRef, projectRef, start, end }: OrgUsageVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgUsageData, OrgUsageError, TData> = {}
) =>
  useQuery<OrgUsageData, OrgUsageError, TData>(
    usageKeys.orgUsage(orgRef, projectRef, start?.toISOString(), end?.toISOString()),
    ({ signal }) => getOrgUsage({ orgRef, projectRef, start, end }, signal),
    {
      enabled: enabled && typeof orgRef !== 'undefined',
      staleTime: 1000 * 60 * 30, // 30 mins, underlying usage data only refreshes once an hour, so safe to cache for a while
      ...options,
    }
  )
