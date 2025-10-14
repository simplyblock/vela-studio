import { del, handleError } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { backupKeys } from './keys'

export interface DeleteBranchBackupVariables {
  orgId?: string
  projectId?: string
  branchId?: string
  backupId?: string
}

export async function deleteBranchBackup(
  { orgId, projectId, branchId, backupId }: DeleteBranchBackupVariables,
  signal?: AbortSignal
) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/backups/{backup}',
    {
      params: {
        path: {
          slug: orgId!,
          ref: projectId!,
          branch: branchId!,
          backup: backupId!,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type DeleteBranchBackupData = Awaited<ReturnType<typeof deleteBranchBackup>>

export const useManualBranchBackupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DeleteBranchBackupData, ResponseError, DeleteBranchBackupVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<DeleteBranchBackupData, ResponseError, DeleteBranchBackupVariables>(
    (vars) => deleteBranchBackup(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await Promise.all([
          queryClient.invalidateQueries(backupKeys.orgBackups(orgId)),
          queryClient.invalidateQueries(backupKeys.branchBackups(orgId, projectId, branchId)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create manual backup: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
