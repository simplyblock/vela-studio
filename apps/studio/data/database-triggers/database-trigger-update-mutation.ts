import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import pgMeta from '@supabase/pg-meta'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { PGTriggerUpdate } from '@supabase/pg-meta/src/pg-meta-triggers'
import { Branch } from 'data/branches/branch-query'

export type DatabaseTriggerUpdateVariables = {
  originalTrigger: {
    id: number
    name: string
    schema: string
    table: string
  }
  branch: Branch
  payload: PGTriggerUpdate
}

export async function updateDatabaseTrigger({
  originalTrigger,
  branch,
  payload,
}: DatabaseTriggerUpdateVariables) {
  const { sql } = pgMeta.triggers.update(originalTrigger, payload)

  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['trigger', 'update', originalTrigger.id],
  })

  return result
}

type DatabaseTriggerUpdateData = Awaited<ReturnType<typeof updateDatabaseTrigger>>

export const useDatabaseTriggerUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseTriggerUpdateData, ResponseError, DatabaseTriggerUpdateVariables>(
    (vars) => updateDatabaseTrigger(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          databaseTriggerKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database trigger: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
