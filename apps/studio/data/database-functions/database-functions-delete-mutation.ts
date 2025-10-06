import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { DatabaseFunction } from './database-functions-query'
import { Branch } from 'api-types/types'

export type DatabaseFunctionDeleteVariables = {
  branch: Branch
  func: DatabaseFunction
}

export async function deleteDatabaseFunction({ branch, func }: DatabaseFunctionDeleteVariables) {
  const { sql, zod } = pgMeta.functions.remove(func)

  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['functions', 'delete', func.id.toString()],
  })

  return result as z.infer<typeof zod>
}

type DatabaseFunctionDeleteData = Awaited<ReturnType<typeof deleteDatabaseFunction>>

export const useDatabaseFunctionDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionDeleteData, ResponseError, DatabaseFunctionDeleteVariables>(
    (vars) => deleteDatabaseFunction(vars),
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
          toast.error(`Failed to delete database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
