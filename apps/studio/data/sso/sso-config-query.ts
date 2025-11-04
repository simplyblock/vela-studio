import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { orgSSOKeys } from './keys'

export type OrgSSOConfigVariables = {
  orgRef?: string
}

export async function getOrgSSOConfig({ orgRef }: OrgSSOConfigVariables, signal?: AbortSignal) {
  if (!orgRef) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/sso', {
    params: {
      path: {
        slug: orgRef,
      },
    },
    signal,
  })

  if (error) {
    const ssoNotSetUp =
      (error as any)?.code === 404 &&
      (error as any)?.message?.includes('Failed to find an existing SSO Provider')

    if (ssoNotSetUp) {
      return null
    } else {
      handleError(error)
    }
  }
  return data
}

export type OrgSSOConfigData = Awaited<ReturnType<typeof getOrgSSOConfig>>
export type OrgSSOConfigError = ResponseError

export const useOrgSSOConfigQuery = <TData = OrgSSOConfigData>(
  { orgRef }: OrgSSOConfigVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgSSOConfigData, OrgSSOConfigError, TData> = {}
) => {
  return useQuery<OrgSSOConfigData, OrgSSOConfigError, TData>(
    orgSSOKeys.orgSSOConfig(orgRef),
    ({ signal }) => getOrgSSOConfig({ orgRef }, signal),
    {
      enabled: enabled && typeof orgRef !== 'undefined' && false,
      ...options,
    }
  )
}
