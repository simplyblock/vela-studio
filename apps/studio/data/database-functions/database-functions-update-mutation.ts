import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import type { DatabaseFunction } from './database-functions-query'
import { Branch } from 'api-types/types'

export type DatabaseFunctionUpdateVariables = {
  branch: Branch
  func: DatabaseFunction
  payload: z.infer<typeof pgMeta.functions.pgFunctionCreateZod>
}

export async function updateDatabaseFunction({
  branch,
  func,
  payload,
}: DatabaseFunctionUpdateVariables) {
  const { sql, zod } = pgMeta.functions.update(func, payload)

  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['functions', 'update', func.id.toString()],
  })

  return result as z.infer<typeof zod>
}

type DatabaseFunctionUpdateData = Awaited<ReturnType<typeof updateDatabaseFunction>>

export const useDatabaseFunctionUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionUpdateData, ResponseError, DatabaseFunctionUpdateVariables>(
    (vars) => updateDatabaseFunction(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          databaseKeys.databaseFunctions(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
