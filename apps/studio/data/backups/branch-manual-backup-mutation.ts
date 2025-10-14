import { handleError, post } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { backupKeys } from './keys'

export interface ManualBranchBackupVariables {
  orgId?: string
  projectId?: string
  branchId?: string
}

export async function createManualBranchBackup(
  { orgId, projectId, branchId }: ManualBranchBackupVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post(
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

type ManualBranchBackupData = Awaited<ReturnType<typeof createManualBranchBackup>>

export const useManualBranchBackupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ManualBranchBackupData, ResponseError, ManualBranchBackupVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ManualBranchBackupData, ResponseError, ManualBranchBackupVariables>(
    (vars) => createManualBranchBackup(vars),
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
