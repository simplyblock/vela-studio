import { get, handleError } from '../fetchers'
import {
  type OmitKeyof,
  QueryFunctionContext,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { resourcesKeys } from './keys'

interface BranchEffectiveLimitsVariables {
  orgSlug?: string
  projectRef?: string
  branchId?: string
}

async function getBranchEffectiveLimits(
  { orgSlug, projectRef, branchId }: BranchEffectiveLimitsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')
  if (!branchId) throw new Error('Branch id is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/resources/limits',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
          branch: branchId,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type BranchEffectiveLimitsData = Awaited<ReturnType<typeof getBranchEffectiveLimits>>
export type BranchEffectiveLimitsError = ResponseError

export const useBranchEffectiveLimitsQuery = <TData = BranchEffectiveLimitsData>(
  { orgSlug, projectRef, branchId }: BranchEffectiveLimitsVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<
    UseQueryOptions<BranchEffectiveLimitsData, BranchEffectiveLimitsError, TData>,
    'initialData'
  > = {}
) => {
  return useQuery<BranchEffectiveLimitsData, BranchEffectiveLimitsError, TData>({
    ...options,
    queryKey: resourcesKeys.branchEffectiveLimits(orgSlug, projectRef, branchId),
    queryFn: async (context: QueryFunctionContext) =>
      getBranchEffectiveLimits({ orgSlug, projectRef }, context.signal),
    enabled:
      enabled &&
      typeof orgSlug !== 'undefined' &&
      typeof projectRef !== 'undefined' &&
      typeof branchId !== 'undefined',
  })
}
