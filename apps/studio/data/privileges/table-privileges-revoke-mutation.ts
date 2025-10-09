import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { invalidateTablePrivilegesQuery } from './table-privileges-query'
import { privilegeKeys } from './keys'
import { Branch } from 'api-types/types'

export type TablePrivilegesRevoke = Parameters<
  typeof pgMeta.tablePrivileges.revoke
>[0] extends (infer T)[]
  ? T
  : never

export type TablePrivilegesRevokeVariables = {
  branch: Branch
  revokes: TablePrivilegesRevoke[]
}

export async function revokeTablePrivileges({ branch, revokes }: TablePrivilegesRevokeVariables) {
  const sql = pgMeta.tablePrivileges.revoke(revokes).sql
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['table-privileges', 'revoke'],
  })
  return result
}

type TablePrivilegesRevokeData = Awaited<ReturnType<typeof revokeTablePrivileges>>

export const useTablePrivilegesRevokeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TablePrivilegesRevokeData, ResponseError, TablePrivilegesRevokeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TablePrivilegesRevokeData, ResponseError, TablePrivilegesRevokeVariables>(
    (vars) => revokeTablePrivileges(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables

        await Promise.all([
          invalidateTablePrivilegesQuery(
            queryClient,
            branch?.organization_id,
            branch?.project_id,
            branch?.id
          ),
          queryClient.invalidateQueries(
            privilegeKeys.columnPrivilegesList(
              branch?.organization_id,
              branch?.project_id,
              branch?.id
            )
          ),
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
