import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { Integration } from './integrations.types'
import { integrationKeys } from './keys'

type IntegrationsVariables = {
  orgRef?: string
}

export async function getIntegrations({ orgRef }: IntegrationsVariables, signal?: AbortSignal) {
  if (!orgRef) throw new Error('orgRef is required')

  const { data, error } = await get('/platform/integrations/{slug}', {
    params: {
      path: {
        slug: orgRef,
      },
    },
  })
  if (error) handleError(error)
  return data as unknown as Integration[]
}

export type IntegrationsData = Awaited<ReturnType<typeof getIntegrations>>
export type ProjectIntegrationConnectionsData = Awaited<ReturnType<typeof getIntegrations>>
export type IntegrationsError = ResponseError

export const useOrgIntegrationsQuery = <TData = IntegrationsData>(
  { orgRef }: IntegrationsVariables,
  { enabled = true, ...options }: UseQueryOptions<IntegrationsData, IntegrationsError, TData> = {}
) =>
  useQuery<IntegrationsData, IntegrationsError, TData>(
    integrationKeys.integrationsListWithOrg(orgRef),
    ({ signal }) => getIntegrations({ orgRef }, signal),
    {
      enabled: enabled && typeof orgRef !== 'undefined',
      staleTime: 30 * 60 * 1000, // 30 minutes
      ...options,
    }
  )
