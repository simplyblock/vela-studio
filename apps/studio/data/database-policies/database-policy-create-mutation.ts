import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'
import { Branch } from 'api-types/types'

type CreatePolicyBody = components['schemas']['CreatePolicyBody']

export type DatabasePolicyCreateVariables = {
  branch: Branch
  payload: CreatePolicyBody
}

export async function createDatabasePolicy({ branch, payload }: DatabasePolicyCreateVariables) {
  const { sql } = pgMeta.policies.create(payload)
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['policy', 'create'],
  })

  return result
}

type DatabasePolicyCreateData = Awaited<ReturnType<typeof createDatabasePolicy>>

export const useDatabasePolicyCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePolicyCreateData, ResponseError, DatabasePolicyCreateVariables>(
    (vars) => createDatabasePolicy(vars),
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
          toast.error(`Failed to create database policy: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
