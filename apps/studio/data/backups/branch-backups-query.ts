import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { backupKeys } from './keys'

export type OrgBackupsVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function getBranchBackups(
  { orgId, projectId, branchId }: OrgBackupsVariables,
  signal?: AbortSignal
) {
  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/backups',
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

export type OrgBackupsData = Awaited<ReturnType<typeof getBranchBackups>>
export type OrgBackupsError = ResponseError

export const useBranchBackupQuery = <TData = OrgBackupsData>(
  { orgId, projectId, branchId }: OrgBackupsVariables,
  { enabled = true, ...options }: UseQueryOptions<OrgBackupsData, OrgBackupsError, TData>
) =>
  useQuery<OrgBackupsData, OrgBackupsError, TData>(
    backupKeys.branchBackups(orgId, projectId, branchId),
    async ({ signal }) => getBranchBackups({ orgId, projectId, branchId }, signal),
    {
      enabled: enabled && typeof orgId !== 'undefined',
      ...options,
    }
  )
