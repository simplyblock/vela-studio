import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabasePolicyUpdateVariables = {
  branch: Branch
  originalPolicy: {
    id: number
    name: string
    schema: string
    table: string
  }
  payload: {
    name?: string
    definition?: string
    check?: string
    roles?: string[]
  }
}

export async function updateDatabasePolicy({
  branch,
  originalPolicy,
  payload,
}: DatabasePolicyUpdateVariables) {
  const { sql } = pgMeta.policies.update(originalPolicy, payload)
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['policy', 'update', originalPolicy.id],
  })

  return result
}

type DatabasePolicyUpdateData = Awaited<ReturnType<typeof updateDatabasePolicy>>

export const useDatabasePolicyUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePolicyUpdateData, ResponseError, DatabasePolicyUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyUpdateData, ResponseError, DatabasePolicyUpdateVariables>(
    (vars) => updateDatabasePolicy(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          databasePoliciesKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database policy: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
