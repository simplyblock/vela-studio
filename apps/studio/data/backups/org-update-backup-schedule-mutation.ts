import { handleError, post, put } from '../fetchers'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { ResponseError } from '../../types'
import { toast } from 'sonner'
import { backupKeys } from './keys'
import { components } from '../vela/vela-schema'

export interface UpdateOrgBackupScheduleVariables {
  orgId: string
  schedule: {
    /** Env Type */
    env_type?: string
    /** Rows */
    rows: components['schemas']['BackupScheduleRowPublic'][]
    /** Existing objects will have an id */
    id?: string
  }
}

export async function updateOrgBackupSchedule(
  { orgId, schedule }: UpdateOrgBackupScheduleVariables,
  signal?: AbortSignal
) {
  if (schedule.id !== undefined) {
    const { data, error } = await put('/platform/organizations/{slug}/backups/schedules', {
      params: {
        path: {
          slug: orgId,
        },
      },
      body: {
        env_type: schedule.env_type,
        rows: schedule.rows,
      },
      signal,
    })

    if (error) handleError(error)
    return data
  }

  const { data, error } = await post('/platform/organizations/{slug}/backups/schedules', {
    params: {
      path: {
        slug: orgId,
      },
    },
    body: {
      env_type: schedule.env_type,
      rows: schedule.rows,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type UpdateOrgBackupScheduleData = Awaited<ReturnType<typeof updateOrgBackupSchedule>>

export const useUpdateOrgBackupScheduleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UpdateOrgBackupScheduleData, ResponseError, UpdateOrgBackupScheduleVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<UpdateOrgBackupScheduleData, ResponseError, UpdateOrgBackupScheduleVariables>(
    (vars) => updateOrgBackupSchedule(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId } = variables
        await Promise.all([queryClient.invalidateQueries(backupKeys.orgBackupSchedules(orgId))])
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
    }
  )
}
