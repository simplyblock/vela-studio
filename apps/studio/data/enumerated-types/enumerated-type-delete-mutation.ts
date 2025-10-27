import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type EnumeratedTypeDeleteVariables = {
  branch: Branch
  name: string
  schema: string
}

export async function deleteEnumeratedType({
  branch,
  name,
  schema,
}: EnumeratedTypeDeleteVariables) {
  const sql = `drop type if exists ${schema}."${name}"`
  const { result } = await executeSql({ branch, sql })
  return result
}

type EnumeratedTypeDeleteData = Awaited<ReturnType<typeof deleteEnumeratedType>>

export const useEnumeratedTypeDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeDeleteData, ResponseError, EnumeratedTypeDeleteVariables>(
    (vars) => deleteEnumeratedType(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          enumeratedTypesKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create enumerated type: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
