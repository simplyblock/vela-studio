import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { ResponseError } from 'types'
import { lintKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type ProjectLintRulesVariables = {
  branch?: Branch
}
type LintDismissalResponse = components['schemas']['ListNotificationExceptionsResponse']
export type LintException = LintDismissalResponse['exceptions'][0]

export async function getProjectLintRules(
  { branch }: ProjectLintRulesVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: {
      path: {
        ref: branch.project_id,
      },
    },
    signal,
  })

  if (error) handleError(error)

  return data
}

export type ProjectLintRulesData = Awaited<ReturnType<typeof getProjectLintRules>>
export type ProjectLintRulesError = ResponseError

export const useProjectLintRulesQuery = <TData = ProjectLintRulesData>(
  { branch }: ProjectLintRulesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectLintRulesData, ProjectLintRulesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ProjectLintRulesData, ProjectLintRulesError, TData>(
    lintKeys.lintRules(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getProjectLintRules({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && isActive,
      ...options,
    }
  )
}
