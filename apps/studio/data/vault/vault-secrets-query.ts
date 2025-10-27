import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { Query } from '@supabase/pg-meta/src/query'
import type { VaultSecret } from 'types'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { vaultSecretsKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export const getVaultSecretsSql = () => {
  const sql = new Query()
    .from('secrets', 'vault')
    .select('id,name,description,secret,created_at,updated_at')
    .toSql()

  return sql
}

export type VaultSecretsVariables = {
  branch?: Branch
}

export async function getVaultSecrets({ branch }: VaultSecretsVariables, signal?: AbortSignal) {
  const sql = getVaultSecretsSql()

  const { result } = await executeSql({ branch, sql, queryKey: ['vault-secrets'] }, signal)

  return result as VaultSecret[]
}

export type VaultSecretsData = Awaited<ReturnType<typeof getVaultSecrets>>
export type VaultSecretsError = ExecuteSqlError

export const useVaultSecretsQuery = <TData = VaultSecretsData>(
  { branch }: VaultSecretsVariables,
  { enabled = true, ...options }: UseQueryOptions<VaultSecretsData, VaultSecretsError, TData> = {}
) =>
  useQuery<VaultSecretsData, VaultSecretsError, TData>(
    vaultSecretsKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getVaultSecrets({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
