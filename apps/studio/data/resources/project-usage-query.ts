import { get, handleError } from '../fetchers'
import {
  type OmitKeyof,
  QueryFunctionContext,
  useQuery,
  UseQueryOptions,
} from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { resourcesKeys } from './keys'

interface ProjectUsageVariables {
  orgSlug?: string
  projectRef?: string
}

async function getProjectUsage(
  { orgSlug, projectRef }: ProjectUsageVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/resources/usage',
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

export type ProjectUsageData = Awaited<ReturnType<typeof getProjectUsage>>
export type ProjectUsageError = ResponseError

export const useProjectUsageQuery = <TData = ProjectUsageData>(
  { orgSlug, projectRef }: ProjectUsageVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<UseQueryOptions<ProjectUsageData, ProjectUsageError, TData>, 'initialData'> = {}
) => {
  return useQuery<ProjectUsageData, ProjectUsageError, TData>({
    ...options,
    queryKey: resourcesKeys.projectUsage(orgSlug, projectRef),
    queryFn: async (context: QueryFunctionContext) =>
      getProjectUsage({ orgRef: orgSlug, projectRef }, context.signal),
    enabled: enabled && typeof orgSlug !== 'undefined' && typeof projectRef !== 'undefined',
  })
}
