import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { backupKeys } from './keys'

export type OrgBackupSchedulesVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function getBranchBackupSchedules(
  { orgId, projectId, branchId }: OrgBackupSchedulesVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/backups/schedules',
    {
      params: {
        path: {
          slug: orgId!,
          ref: projectId!,
          branch: branchId!,
        },
      },
      signal,
    }
  )
  if (error) handleError(error)
  return data
}

export type OrgBackupSchedulesData = Awaited<ReturnType<typeof getBranchBackupSchedules>>
export type OrgBackupSchedulesError = ResponseError

export const useBranchBackupSchedulesQuery = <TData = OrgBackupSchedulesData>(
  { orgId, projectId, branchId }: OrgBackupSchedulesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgBackupSchedulesData, OrgBackupSchedulesError, TData>
) =>
  useQuery<OrgBackupSchedulesData, OrgBackupSchedulesError, TData>(
    backupKeys.branchBackupSchedules(orgId, projectId, branchId),
    async ({ signal }) => getBranchBackupSchedules({ orgId, projectId, branchId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined',
      ...options,
    }
  )
