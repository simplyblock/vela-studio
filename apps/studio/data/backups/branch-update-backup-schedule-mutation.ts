import { handleError, put } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { backupKeys } from './keys'
import { components } from '../vela/vela-schema'

export interface UpdateBranchBackupScheduleVariables {
  orgId: string
  projectId: string
  branchId: string
  schedule: {
    /** Env Type */
    env_type?: string
    /** Rows */
    rows: components['schemas']['BackupScheduleRowPublic'][]
  }
}

export async function updateBranchBackupSchedule(
  { orgId, projectId, branchId, schedule }: UpdateBranchBackupScheduleVariables,
  signal?: AbortSignal
) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/backups/schedules',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
        },
      },
      body: schedule,
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type UpdateBranchBackupScheduleData = Awaited<ReturnType<typeof updateBranchBackupSchedule>>

export const useUpdateBranchBackupScheduleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    UpdateBranchBackupScheduleData,
    ResponseError,
    UpdateBranchBackupScheduleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    UpdateBranchBackupScheduleData,
    ResponseError,
    UpdateBranchBackupScheduleVariables
  >((vars) => updateBranchBackupSchedule(vars), {
    async onSuccess(data, variables, context) {
      const { orgId, projectId, branchId } = variables
      await Promise.all([
        queryClient.invalidateQueries(backupKeys.orgBackupSchedules(orgId)),
        queryClient.invalidateQueries(backupKeys.branchBackupSchedules(orgId, projectId, branchId)),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete backup schedule: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
