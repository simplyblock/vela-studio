import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'

type ProjectLintsVariables = {
  orgSlug?: string
  projectRef?: string
}
type ProjectLintResponse = components['schemas']['GetProjectLintsResponse']
export type Lint = ProjectLintResponse[0]
export type LINT_TYPES = ProjectLintResponse[0]['name']

export async function getProjectLints({ orgSlug, projectRef }: ProjectLintsVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/run-lints`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ProjectLintsData = Awaited<ReturnType<typeof getProjectLints>>
export type ProjectLintsError = ResponseError

export const useProjectLintsQuery = <TData = ProjectLintsData>(
  { orgSlug, projectRef }: ProjectLintsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectLintsData, ProjectLintsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ProjectLintsData, ProjectLintsError, TData>(
    lintKeys.lint(orgSlug, projectRef),
    ({ signal }) => getProjectLints({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined' && isActive,
      ...options,
    }
  )
}
