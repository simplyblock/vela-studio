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
  orgRef?: string
  projectRef?: string
  start?: string
  end?: string
}

async function getProjectUsage(
  { orgRef, projectRef, start, end }: ProjectUsageVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/resources/usage',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
        },
        query: {
          cycle_start: start,
          cycle_end: end,
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
  { orgRef, projectRef, start, end }: ProjectUsageVariables,
  {
    enabled = true,
    ...options
  }: OmitKeyof<UseQueryOptions<ProjectUsageData, ProjectUsageError, TData>, 'initialData'> = {}
) => {
  return useQuery<ProjectUsageData, ProjectUsageError, TData>({
    ...options,
    queryKey: resourcesKeys.projectUsage(orgRef, projectRef), // FIXME: @Chris do we want to cache this?
    staleTime: 60000,
    queryFn: async (context: QueryFunctionContext) =>
      getProjectUsage({ orgRef, projectRef, start, end }, context.signal),
    enabled: enabled && typeof orgRef !== 'undefined' && typeof projectRef !== 'undefined',
  })
}
