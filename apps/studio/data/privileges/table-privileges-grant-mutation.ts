import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateTablePrivilegesQuery } from './table-privileges-query'
import { privilegeKeys } from './keys'
import { Branch } from 'api-types/types'

export type TablePrivilegesGrant = Parameters<
  typeof pgMeta.tablePrivileges.grant
>[0] extends (infer T)[]
  ? T
  : never

export type TablePrivilegesGrantVariables = {
  branch: Branch
  grants: TablePrivilegesGrant[]
}

export async function grantTablePrivileges({
  branch,
  grants,
}: TablePrivilegesGrantVariables) {
  const sql = pgMeta.tablePrivileges.grant(grants).sql
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['table-privileges', 'grant'],
  })
  return result
}

type TablePrivilegesGrantData = Awaited<ReturnType<typeof grantTablePrivileges>>

export const useTablePrivilegesGrantMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TablePrivilegesGrantData, ResponseError, TablePrivilegesGrantVariables>(
    (vars) => grantTablePrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables

        await Promise.all([
          invalidateTablePrivilegesQuery(queryClient, branch?.organization_id, branch?.project_id, branch?.id),
          queryClient.invalidateQueries(privilegeKeys.columnPrivilegesList(branch?.organization_id, branch?.project_id, branch?.id)),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
