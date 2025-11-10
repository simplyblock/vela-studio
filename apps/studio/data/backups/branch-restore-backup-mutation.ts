import { handleError, post } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { components } from '../vela/vela-schema'
import { branchKeys } from '../branches/keys'

export interface RestoreBranchBackupVariables {
  orgId?: string
  projectId?: string
  backupId?: string
  branchName: string
  withConfig?: boolean
  envType?: string
  deployment?: components['schemas']['BranchSourceDeploymentParameters']
}

export async function restoreBranchBackup(
  {
    orgId,
    projectId,
    backupId,
    branchName,
    envType,
    withConfig,
    deployment,
  }: RestoreBranchBackupVariables,
  signal?: AbortSignal
) {
  if (!backupId) throw new Error('backupId is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/backups/restore',
    {
      params: {
        path: {
          slug: orgId!,
          ref: projectId!,
        },
      },
      body: {
        name: branchName,
        env_type: envType,
        restore: {
          backup_id: backupId,
          config_copy: withConfig,
          deployment_parameters: deployment
            ? {
                milli_vcpu: deployment.milli_vcpu,
                memory_bytes: deployment.memory_bytes,
                iops: deployment.iops,
                database_size: deployment.database_size,
                storage_size: deployment.storage_size,
                enable_file_storage: deployment.enable_file_storage,
              }
            : undefined,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type RestoreBranchBackupData = Awaited<ReturnType<typeof restoreBranchBackup>>

export const useRestoreBranchBackupMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<RestoreBranchBackupData, ResponseError, RestoreBranchBackupVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<RestoreBranchBackupData, ResponseError, RestoreBranchBackupVariables>(
    (vars) => restoreBranchBackup(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId } = variables
        await Promise.all([queryClient.invalidateQueries(branchKeys.list(orgId, projectId))])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete backup: ${data.message}`)
          return
        }
        onError(data, variables, context)
      },
      ...options,
    }
  )
}
