import { del, handleError } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { backupKeys } from './keys'

export interface DeleteBranchBackupScheduleVariables {
  orgId: string
  projectId: string
  branchId: string
  scheduleId: string
}

export async function deleteBranchBackupSchedule(
  { orgId, projectId, branchId, scheduleId }: DeleteBranchBackupScheduleVariables,
  signal?: AbortSignal
) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/backups/schedules/{id}',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
          id: scheduleId,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type DeleteBranchBackupScheduleData = Awaited<ReturnType<typeof deleteBranchBackupSchedule>>

export const useDeleteBranchBackupScheduleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DeleteBranchBackupScheduleData,
    ResponseError,
    DeleteBranchBackupScheduleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<
    DeleteBranchBackupScheduleData,
    ResponseError,
    DeleteBranchBackupScheduleVariables
  >((vars) => deleteBranchBackupSchedule(vars), {
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
