import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import pgMeta from '@supabase/pg-meta'
import { databaseKeys } from 'data/database/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { Branch } from 'api-types/types'

export type DatabaseFunctionCreateVariables = {
  branch: Branch
  payload: z.infer<typeof pgMeta.functions.pgFunctionCreateZod>
}

export async function createDatabaseFunction({ branch, payload }: DatabaseFunctionCreateVariables) {
  const { sql, zod } = pgMeta.functions.create(payload)

  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['functions', 'create'],
  })

  return result as z.infer<typeof zod>
}

type DatabaseFunctionCreateData = Awaited<ReturnType<typeof createDatabaseFunction>>

export const useDatabaseFunctionCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseFunctionCreateData, ResponseError, DatabaseFunctionCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseFunctionCreateData, ResponseError, DatabaseFunctionCreateVariables>(
    (vars) => createDatabaseFunction(vars),
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
          toast.error(`Failed to create database function: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
