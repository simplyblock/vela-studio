import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { vaultSecretsKeys } from './keys'
import { Branch } from 'api-types/types'

export type VaultSecretDeleteVariables = {
  branch: Branch
  id: string
}

export async function deleteVaultSecret({ branch, id }: VaultSecretDeleteVariables) {
  const sql = new Query().from('secrets', 'vault').delete().match({ id }).toSql()
  const { result } = await executeSql({ branch, sql })
  return result
}

type VaultSecretDeleteData = Awaited<ReturnType<typeof deleteVaultSecret>>

export const useVaultSecretDeleteMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretDeleteData, ResponseError, VaultSecretDeleteVariables>(
    (vars) => deleteVaultSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          vaultSecretsKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete key: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
