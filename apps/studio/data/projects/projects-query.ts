import { QueryClient, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

import { get, handleError } from 'data/fetchers'
import { useProfile } from 'lib/profile'
import type { Organization, ResponseError } from 'types'
import { projectKeys } from './keys'
import type { ProjectDetail } from './project-detail-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { getPathReferences } from '../vela/path-references'
import { components } from '../vela/vela-schema'

export type ProjectsVariables = {
  ref?: string
}

export type ProjectInfo = components['schemas']['ProjectPublic']

export async function getProjects({
  signal,
  headers,
  orgRef,
}: {
  signal?: AbortSignal
  headers?: Record<string, string>
  orgRef?: string
}) {
  if (!orgRef) throw new Error('orgSlug is required')
  const { data, error } = await get('/platform/organizations/{slug}/projects', {
    signal,
    params: {
      path: {
        slug: orgRef,
      },
    },
  })
  if (error) handleError(error)
  return data as ProjectInfo[]
}

export type ProjectsData = Awaited<ReturnType<typeof getProjects>>
export type ProjectsError = ResponseError

export const useProjectsQuery = <TData = ProjectsData>({
  enabled = true,
  ...options
}: UseQueryOptions<ProjectsData, ProjectsError, TData> = {}) => {
  const { profile } = useProfile()
  const { slug } = getPathReferences()
  return useQuery<ProjectsData, ProjectsError, TData>(
    projectKeys.orgProjects(slug),
    ({ signal }) => getProjects({ signal, orgRef: slug }),
    {
      enabled: enabled && profile !== undefined && typeof slug !== 'undefined',
      staleTime: 30 * 60 * 1000, // 30 minutes
      ...options,
    }
  )
}

export function prefetchProjects(client: QueryClient, organization?: Organization | undefined) {
  if (typeof organization === 'undefined') return Promise.resolve()
  return client.prefetchQuery(projectKeys.orgProjects(organization?.id), ({ signal }) =>
    getProjects({ signal, orgRef: organization?.id })
  )
}

export function useProjectsPrefetch(organization?: Organization | undefined) {
  const client = useQueryClient()

  return useCallback(() => {
    prefetchProjects(client, organization)
  }, [client, organization])
}

export function useAutoProjectsPrefetch() {
  const { data: organization } = useSelectedOrganizationQuery()
  const prefetch = useProjectsPrefetch(organization)

  const called = useRef<boolean>(false)
  if (called.current === false) {
    called.current = true
    prefetch()
  }
}

export function invalidateProjectsQuery(client: QueryClient) {
  return client.invalidateQueries(projectKeys.list())
}

export function setProjectStatus(
  client: QueryClient,
  slug: Organization['id'],
  projectRef: ProjectDetail['id'],
  status: ProjectDetail['status']
) {
  client.setQueriesData<ProjectDetail[] | undefined>(
    projectKeys.orgProjects(slug),
    (old) => {
      if (!old) return old

      return old.map((project) => {
        if (project.id === projectRef) {
          return { ...project, status }
        }
        return project
      })
    },
    { updatedAt: Date.now() }
  )

  client.setQueriesData<ProjectDetail>(
    projectKeys.detail(slug, projectRef),
    (old) => {
      if (!old) return old

      return { ...old, status }
    },
    { updatedAt: Date.now() }
  )
}

export function setProjectPostgrestStatus(
  client: QueryClient,
  slug: Organization['id'],
  projectRef: ProjectDetail['id'],
  status: ProjectDetail['status']
) {
  client.setQueriesData<ProjectDetail>(
    projectKeys.detail(slug, projectRef),
    (old) => {
      if (!old) return old

      return { ...old, postgrsestStatus: status }
    },
    { updatedAt: Date.now() }
  )
}
