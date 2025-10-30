import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { networkRestrictionKeys } from './keys'

export type NetworkRestrictionsVariables = { orgSlug?: string, projectRef?: string }

export type NetworkRestrictionsResponse = {
  entitlement: 'disallowed' | 'allowed'
  status: '' | 'stored' | 'applied'
  config: { dbAllowedCidrs: string[] }
  old_config?: { dbAllowedCidrs: string[] }
  error?: any
}

export async function getNetworkRestrictions(
  { orgSlug, projectRef }: NetworkRestrictionsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/network-restrictions', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  // Not allowed error is a valid response to denote if a project
  // has access to the network restrictions UI, so we'll handle it here
  if (error) {
    const isNotAllowedError =
      (error as any)?.code === 400 &&
      (error as any)?.message?.includes('not allowed to set up network restrictions')

    if (isNotAllowedError) {
      return {
        entitlement: 'disallowed',
        config: { dbAllowedCidrs: [] },
        status: '',
      } as NetworkRestrictionsResponse
    } else {
      handleError(error)
    }
  }

  return data
}

export type NetworkRestrictionsData = Awaited<ReturnType<typeof getNetworkRestrictions>>
export type NetworkRestrictionsError = unknown

export const useNetworkRestrictionsQuery = <TData = NetworkRestrictionsData>(
  { orgSlug, projectRef }: NetworkRestrictionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<NetworkRestrictionsData, NetworkRestrictionsError, TData> = {}
) =>
  useQuery<NetworkRestrictionsData, NetworkRestrictionsError, TData>(
    networkRestrictionKeys.list(orgSlug, projectRef),
    ({ signal }) => getNetworkRestrictions({ orgRef: orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
