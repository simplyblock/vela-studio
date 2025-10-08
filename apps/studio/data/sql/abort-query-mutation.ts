import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { sqlKeys } from './keys'
import { Branch } from 'api-types/types'

export type QueryAbortVariables = {
  pid: number
  branch?: Branch
}

export async function abortQuery({ pid, branch }: QueryAbortVariables) {
  const sql = /* SQL */ `select pg_terminate_backend(${pid})`
  const { result } = await executeSql({ branch, sql })
  return result
}

type QueryAbortData = Awaited<ReturnType<typeof abortQuery>>

export const useQueryAbortMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<QueryAbortData, ResponseError, QueryAbortVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<QueryAbortData, ResponseError, QueryAbortVariables>(
    (vars) => abortQuery(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          sqlKeys.ongoingQueries(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to abort query: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
