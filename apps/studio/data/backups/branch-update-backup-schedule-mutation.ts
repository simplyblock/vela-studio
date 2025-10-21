import { handleError, post, put } from '../fetchers'
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
    /** Existing objects will have an id */
    id?: string
  }
}

export async function updateBranchBackupSchedule(
  { orgId, projectId, branchId, schedule }: UpdateBranchBackupScheduleVariables,
  signal?: AbortSignal
) {
  // If id is set, run an update, otherwise create a new schedule
  if (schedule.id !== undefined) {
    const { data, error } = await put(
      '/platform/organizations/{slug}/backups/schedules',
      {
        params: {
          path: {
            slug: orgId,
          },
        },
        body: {
          payload: {
            env_type: schedule.env_type,
            rows: schedule.rows,
          },
          schedule: {
            organization_id: null,
            branch_id: branchId,
            env_type: schedule.env_type
          },
        },
        signal,
      }
    )

    if (error) handleError(error)
    return data
  }

  const { data, error } = await post(
    '/platform/organizations/{slug}/backups/schedules',
    {
      params: {
        path: {
          slug: orgId,
        },
      },
      body: {
        payload: {
          env_type: schedule.env_type,
          rows: schedule.rows,
        },
        schedule: {
          organization_id: null,
          branch_id: branchId,
          env_type: schedule.env_type
        },
      },
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
