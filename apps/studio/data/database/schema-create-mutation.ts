import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateSchemasQuery } from './schemas-query'
import { Branch } from 'api-types/types'

export type SchemaCreateVariables = {
  name: string
  branch?: Branch
}

export async function createSchema({ name, branch }: SchemaCreateVariables) {
  const sql = pgMeta.schemas.create({ name, owner: 'postgres' }).sql
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['schema', 'create'],
  })
  return result
}

type SchemaCreateData = Awaited<ReturnType<typeof createSchema>>

export const useSchemaCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SchemaCreateData, ResponseError, SchemaCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SchemaCreateData, ResponseError, SchemaCreateVariables>(
    (vars) => createSchema(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await invalidateSchemasQuery(
          queryClient,
          branch?.organization_id,
          branch?.project_id,
          branch?.id
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create schema: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
