import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { subscriptionKeys } from './keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export type OrgSubscriptionVariables = {
  orgRef?: string
}

export async function getOrgSubscription(
  { orgRef }: OrgSubscriptionVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgSlug is required')

  const { error, data } = await get('/platform/organizations/{slug}/billing/subscription', {
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

export type OrgSubscriptionData = Awaited<ReturnType<typeof getOrgSubscription>>
export type OrgSubscriptionError = ResponseError

export const useOrgSubscriptionQuery = <TData = OrgSubscriptionData>(
  { orgRef }: OrgSubscriptionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgSubscriptionData, OrgSubscriptionError, TData> = {}
) => {
  const canReadSubscriptions = useCheckPermissions('branch:settings:admin')

  return useQuery<OrgSubscriptionData, OrgSubscriptionError, TData>(
    subscriptionKeys.orgSubscription(orgRef),
    ({ signal }) => getOrgSubscription({ orgRef }, signal),
    {
      enabled: enabled && canReadSubscriptions && typeof orgRef !== 'undefined',
      staleTime: 60 * 60 * 1000, // 60 minutes
      ...options,
    }
  )
}
