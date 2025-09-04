import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { serviceStatusKeys } from './keys'

export type ProjectServiceStatusVariables = {
  orgSlug?: string
  projectRef?: string
}

export async function getProjectServiceStatus(
  { orgSlug, projectRef }: ProjectServiceStatusVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/health`, {
    params: {
      path: { slug: orgSlug, ref: projectRef },
      query: {
        services: ['auth', 'realtime', 'rest', 'storage', 'db'],
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectServiceStatusData = Awaited<ReturnType<typeof getProjectServiceStatus>>
export type ProjectServiceStatus = ProjectServiceStatusData[0]['status']
export type ProjectServiceStatusError = ResponseError

export const useProjectServiceStatusQuery = <TData = ProjectServiceStatusData>(
  { orgSlug, projectRef }: ProjectServiceStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectServiceStatusData, ProjectServiceStatusError, TData> = {}
) =>
  useQuery<ProjectServiceStatusData, ProjectServiceStatusError, TData>(
    serviceStatusKeys.serviceStatus(orgSlug, projectRef),
    ({ signal }) => getProjectServiceStatus({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
