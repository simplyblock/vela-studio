import { get, handleError } from '../fetchers'
import {
  type OmitKeyof,
  QueryFunctionContext,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { resourcesKeys } from './keys'

interface ProjectLimitsVariables {
  orgSlug?: string
  projectRef?: string
}

async function getProjectLimits(
  { orgSlug, projectRef }: ProjectLimitsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/resources/limits',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type ProjectLimitsData = Awaited<ReturnType<typeof getProjectLimits>>
export type ProjectLimitsError = ResponseError

export const useProjectLimitsQuery = <TData = ProjectLimitsData>(
  { orgSlug, projectRef }: ProjectLimitsVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<UseQueryOptions<ProjectLimitsData, ProjectLimitsError, TData>, 'initialData'> = {}
) => {
  return useQuery<ProjectLimitsData, ProjectLimitsError, TData>({
    ...options,
    queryKey: resourcesKeys.projectLimits(orgSlug, projectRef),
    queryFn: async (context: QueryFunctionContext) =>
      getProjectLimits({ orgSlug, projectRef }, context.signal),
    enabled: enabled && typeof orgSlug !== 'undefined' && typeof projectRef !== 'undefined',
  })
}
