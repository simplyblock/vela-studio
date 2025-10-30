import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export type OrgSubscriptionVariables = {
  orgSlug?: string
}

export async function getOrgSubscription(
  { orgSlug }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
    params: { path: { slug: orgSlug } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgSlug }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) => {
  const canReadSubscriptions = useCheckPermissions("branch:settings:admin")

  return useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>(
    subscriptionKeys.orgSubscription(orgSlug),
    ({ signal }) => getOrgSubscription({ orgRef: orgSlug }, signal),
    {
      enabled: enabled && canReadSubscriptions && typeof orgSlug !== 'undefined',
      staleTime: 60 * 60 * 1000, // 60 minutes
      ...options,
    }
  )
}
