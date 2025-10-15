import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { backupKeys } from './keys'

export type OrgBackupsVariables = {
  orgId?: string
}

export async function getOrgBackups({ orgId }: OrgBackupsVariables, signal?: AbortSignal) {
  const { data, error } = await get('/platform/organizations/{slug}/backups', {
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

export type OrgBackupsData = Awaited<ReturnType<typeof getOrgBackups>>
export type OrgBackupsError = ResponseError

export const useOrgBackupQuery = <TData = OrgBackupsData>(
  { orgId }: OrgBackupsVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgBackupsData, OrgBackupsError, TData>
) =>
  useQuery<OrgBackupsData, OrgBackupsError, TData>(
    backupKeys.orgBackups(orgId),
    ({ signal }) => getOrgBackups({ orgId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined',
      ...options,
    }
  )
