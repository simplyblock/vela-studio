import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { backupKeys } from './keys'

export type OrgBackupSchedulesVariables = {
  orgId?: string
}

export async function getOrgBackupSchedules(
  { orgId }: OrgBackupSchedulesVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get('/platform/organizations/{slug}/backups/schedules', {
    params: {
      path: {
        slug: orgId!,
      },
    },
    signal,
  })
  if (error) handleError(error)
  return data
}

export type OrgBackupSchedulesData = Awaited<ReturnType<typeof getOrgBackupSchedules>>
export type OrgBackupSchedulesError = ResponseError

export const useOrgBackupSchedulesQuery = <TData = OrgBackupSchedulesData>(
  { orgId }: OrgBackupSchedulesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<OrgBackupSchedulesData, OrgBackupSchedulesError, TData> = {}
) =>
  useQuery<OrgBackupSchedulesData, OrgBackupSchedulesError, TData>(
    backupKeys.orgBackupSchedules(orgId),
    ({ signal }) => getOrgBackupSchedules({ orgId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined',
      ...options,
    }
  )
