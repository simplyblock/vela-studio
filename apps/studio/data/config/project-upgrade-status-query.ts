import { DatabaseUpgradeStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { PROJECT_STATUS } from 'lib/constants'
import { configKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type ProjectUpgradingStatusVariables = {
  branch?: Branch
  projectStatus?: string
  trackingId?: string | null
}

export async function getProjectUpgradingStatus(
  { branch, trackingId }: ProjectUpgradingStatusVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const queryParams: Record<string, string> = {}
  if (trackingId) {
    queryParams['tracking_id'] = trackingId
  }

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/upgrade/status`,
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
        },
        query: queryParams,
      },
      signal,
    }
  )
  if (error) handleError(error)

  return data
}

export type ProjectUpgradingStatusData = Awaited<ReturnType<typeof getProjectUpgradingStatus>>
export type ProjectUpgradingStatusError = unknown

export const useProjectUpgradingStatusQuery = <TData = ProjectUpgradingStatusData>(
  { branch, projectStatus, trackingId }: ProjectUpgradingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  return useQuery<ProjectUpgradingStatusData, ProjectUpgradingStatusError, TData>(
    configKeys.upgradeStatus(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getProjectUpgradingStatus({ branch, trackingId }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      refetchInterval(data) {
        const response = data as unknown as ProjectUpgradingStatusData
        if (!response) return false

        const interval =
          // Transited to UPGRADING state via client, but job not yet picked up
          (projectStatus === PROJECT_STATUS.MIGRATING &&
            response.databaseUpgradeStatus?.status !== DatabaseUpgradeStatus.Upgrading) ||
          // Project currently getting upgraded
          response.databaseUpgradeStatus?.status === DatabaseUpgradeStatus.Upgrading
            ? 5000
            : false

        return interval
      },
      onSuccess(data) {
        const response = data as unknown as ProjectUpgradingStatusData
        if (response.databaseUpgradeStatus?.status === DatabaseUpgradeStatus.Upgraded) {
          client.invalidateQueries(
            configKeys.upgradeEligibility(branch?.organization_id, branch?.project_id, branch?.id)
          )
        }
      },
      ...options,
    }
  )
}
