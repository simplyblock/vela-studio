import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'api-types'
import { IS_PLATFORM } from 'common'
import { get, handleError } from 'data/fetchers'
import { useProjectByRefQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants/infrastructure'
import type { ResponseError } from 'types'
import { configKeys } from './keys'

export type ProjectUpgradeTargetVersion = { postgres_version: string; release_channel: string }
export type ProjectUpgradeEligibilityVariables = { orgSlug?: string, projectRef?: string }
export type ProjectUpgradeEligibilityResponse =
  components['schemas']['ProjectUpgradeEligibilityResponse']

export async function getProjectUpgradeEligibility(
  { orgSlug, projectRef }: ProjectUpgradeEligibilityVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/upgrade/eligibility', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ProjectUpgradeEligibilityData = Awaited<ReturnType<typeof getProjectUpgradeEligibility>>
export type ProjectUpgradeEligibilityError = ResponseError

export const useProjectUpgradeEligibilityQuery = <TData = ProjectUpgradeEligibilityData>(
  { orgSlug, projectRef }: ProjectUpgradeEligibilityVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData> = {}
) => {
  const { data: project } = useProjectByRefQuery(projectRef)
  return useQuery<ProjectUpgradeEligibilityData, ProjectUpgradeEligibilityError, TData>(
    configKeys.upgradeEligibility(orgSlug, projectRef),
    ({ signal }) => getProjectUpgradeEligibility({ orgSlug, projectRef }, signal),
    {
      enabled:
        enabled &&
        project !== undefined &&
        project.status === PROJECT_STATUS.ACTIVE_HEALTHY &&
        typeof projectRef !== 'undefined' &&
        IS_PLATFORM,
      ...options,
    }
  )
}
