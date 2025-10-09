import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateRolesQuery } from './database-roles-query'
import { Branch } from 'api-types/types'

type DropRoleBody = Parameters<typeof pgMeta.roles.remove>[1]

export type DatabaseRoleDeleteVariables = {
  branch: Branch
  id: number
  payload?: DropRoleBody
}

export async function deleteDatabaseRole({ branch, id, payload }: DatabaseRoleDeleteVariables) {
  const sql = pgMeta.roles.remove({ id }, payload).sql
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['roles', 'delete'],
  })
  return result
}

type DatabaseRoleDeleteData = Awaited<ReturnType<typeof deleteDatabaseRole>>

export const useDatabaseRoleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseRoleDeleteData, ResponseError, DatabaseRoleDeleteVariables>(
    (vars) => deleteDatabaseRole(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await invalidateRolesQuery(
          queryClient,
          branch?.organization_id,
          branch?.project_id,
          branch?.id
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
