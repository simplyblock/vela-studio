import { get, handleError } from '../fetchers'
import {
  type OmitKeyof,
  QueryFunctionContext,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { resourcesKeys } from './keys'

interface OrganizationUsageVariables {
  orgSlug?: string
}

async function getOrganizationUsage({ orgSlug }: OrganizationUsageVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/resources/usage', {
    params: {
      path: {
        slug: orgSlug,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationUsageData = Awaited<ReturnType<typeof getOrganizationUsage>>
export type OrganizationUsageError = ResponseError

export const useOrganizationUsageQuery = <TData = OrganizationUsageData>(
  { orgSlug }: OrganizationUsageVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<
    UseQueryOptions<OrganizationUsageData, OrganizationUsageError, TData>,
    'initialData'
  > = {}
) => {
  return useQuery<OrganizationUsageData, OrganizationUsageError, TData>({
    ...options,
    queryKey: resourcesKeys.organizationUsage(orgSlug),
    queryFn: async (context: QueryFunctionContext) =>
      getOrganizationUsage({ orgSlug }, context.signal),
    enabled: enabled && typeof orgSlug !== 'undefined',
  })
}
