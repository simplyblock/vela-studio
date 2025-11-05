import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type ProjectLintsVariables = {
  branch?: Branch
}
type ProjectLintResponse = components['schemas']['GetProjectLintsResponse']
export type Lint = ProjectLintResponse[0]
export type LINT_TYPES = ProjectLintResponse[0]['name']

export async function getProjectLints({ branch }: ProjectLintsVariables, signal?: AbortSignal) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/branches/{branch}/run-lints`, {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id,
      },
    },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ProjectLintsData = Awaited<ReturnType<typeof getProjectLints>>
export type ProjectLintsError = ResponseError

export const useProjectLintsQuery = <TData = ProjectLintsData>(
  { branch }: ProjectLintsVariables,
  { enabled = true, ...options }: UseQueryOptions<ProjectLintsData, ProjectLintsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.STARTED

  return useQuery<ProjectLintsData, ProjectLintsError, TData>(
    lintKeys.lint(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getProjectLints({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && isActive,
      ...options,
    }
  )
}
