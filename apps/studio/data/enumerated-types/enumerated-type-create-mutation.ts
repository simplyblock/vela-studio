import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { Branch } from 'api-types/types'

export type EnumeratedTypeCreateVariables = {
  branch: Branch
  schema: string
  name: string
  description?: string
  values: string[]
}

export async function createEnumeratedType({
  branch,
  schema,
  name,
  description,
  values,
}: EnumeratedTypeCreateVariables) {
  const createSql = `create type "${schema}"."${name}" as enum (${values
    .map((x) => `'${x}'`)
    .join(', ')});`
  const commentSql =
    description !== undefined ? `comment on type "${schema}"."${name}" is '${description}';` : ''
  const sql = wrapWithTransaction(`${createSql} ${commentSql}`)
  const { result } = await executeSql({ branch, sql })
  return result
}

type EnumeratedTypeCreateData = Awaited<ReturnType<typeof createEnumeratedType>>

export const useEnumeratedTypeCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<EnumeratedTypeCreateData, ResponseError, EnumeratedTypeCreateVariables>(
    (vars) => createEnumeratedType(vars),
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
