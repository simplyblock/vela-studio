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
  orgRef?: string
}

async function getOrganizationUsage({ orgRef }: OrganizationUsageVariables, signal?: AbortSignal) {
  if (!orgRef) throw new Error('Organization slug is required')

  const { data, error } = await get('/platform/organizations/{slug}/resources/usage', {
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

export type OrganizationUsageData = Awaited<ReturnType<typeof getOrganizationUsage>>
export type OrganizationUsageError = ResponseError

export const useOrganizationUsageQuery = <TData = OrganizationUsageData>(
  { orgRef }: OrganizationUsageVariables,
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
    queryKey: resourcesKeys.organizationUsage(orgRef),
    queryFn: async (context: QueryFunctionContext) =>
      getOrganizationUsage({ orgRef }, context.signal),
    enabled: enabled && typeof orgRef !== 'undefined',
  })
}
