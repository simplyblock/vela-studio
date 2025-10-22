import { get, handleError } from '../fetchers'
import {
  type OmitKeyof,
  QueryFunctionContext,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { resourcesKeys } from './keys'

interface OrganizationLimitsVariables {
  orgSlug?: string
}

async function getOrganizationLimits(
  { orgSlug }: OrganizationLimitsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/resources/limits', {
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

export type OrganizationLimitsData = Awaited<ReturnType<typeof getOrganizationLimits>>
export type OrganizationLimitsError = ResponseError

export const useOrganizationLimitsQuery = <TData = OrganizationLimitsData>(
  { orgSlug }: OrganizationLimitsVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<
    UseQueryOptions<OrganizationLimitsData, OrganizationLimitsError, TData>,
    'initialData'
  > = {}
) => {
  return useQuery<OrganizationLimitsData, OrganizationLimitsError, TData>({
    ...options,
    queryKey: resourcesKeys.organizationLimits(orgSlug),
    queryFn: async (context: QueryFunctionContext) =>
      getOrganizationLimits({ orgSlug }, context.signal),
    enabled: enabled && typeof orgSlug !== 'undefined',
  })
}
