import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import { quoteLiteral } from 'lib/pg-format'
import type { ResponseError, VaultSecret } from 'types'
import { vaultSecretsKeys } from './keys'
import { Branch } from 'api-types/types'

export type VaultSecretCreateVariables = {
  branch: Branch
} & Partial<VaultSecret>

export async function createVaultSecret({ branch, ...newSecret }: VaultSecretCreateVariables) {
  const { name, description, secret } = newSecret
  const sql = /* SQL */ `
select vault.create_secret(
    new_secret := ${quoteLiteral(secret)}
  ${name ? `, new_name := ${quoteLiteral(name)}` : ''}
  ${description ? `, new_description := ${quoteLiteral(description)}` : ''}
)
`

  const { result } = await executeSql({ branch, sql })
  return result
}

type VaultSecretCreateData = Awaited<ReturnType<typeof createVaultSecret>>

export const useVaultSecretCreateMutation = ({
  onError,
  onSuccess,
  ...options
}: Omit<
  UseMutationOptions<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<VaultSecretCreateData, ResponseError, VaultSecretCreateVariables>(
    (vars) => createVaultSecret(vars),
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
          toast.error(`Failed to create secret: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
