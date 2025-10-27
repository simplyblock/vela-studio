import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'
import { components } from 'data/vela/vela-schema'

export type ProjectDetailVariables = { slug?: string; ref?: string }

export type ProjectDetail = components['schemas']['ProjectPublic']

export async function getProjectDetail(
  { slug, ref }: ProjectDetailVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('Organization slug is required')
  if (!ref) throw new Error('Project ref is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}', {
    params: {
      path: {
        slug,
        ref,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectDetailData = Awaited<ReturnType<typeof getProjectDetail>>
export type ProjectDetailError = ResponseError

export const useProjectDetailQuery = <TData = ProjectDetailData>(
  { slug, ref }: ProjectDetailVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectDetailData, ProjectDetailError, TData> = {}
) => {
  return useQuery<ProjectDetailData, ProjectDetailError, TData>(
    projectKeys.detail(slug, ref),
    ({ signal }) => getProjectDetail({ ref, slug }, signal),
    {
      enabled: enabled && typeof ref !== 'undefined',
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval(data) {
        const result = data && (data as unknown as ProjectDetailData)
        const status = result && result.status

        if (status === 'STARTING' || status === 'UNKNOWN') {
          return 5 * 1000 // 5 seconds
        }

        return false
      },
      ...options,
    }
  )
}

export function invalidateProjectDetailsQuery(client: QueryClient, slug: string, ref: string) {
  return client.invalidateQueries(projectKeys.detail(slug, ref))
}

export function prefetchProjectDetail(client: QueryClient, { slug, ref }: ProjectDetailVariables) {
  return client.fetchQuery(projectKeys.detail(slug, ref), ({ signal }) =>
    getProjectDetail({ slug, ref }, signal)
  )
}
