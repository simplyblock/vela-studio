import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import type { ResponseError } from 'types'
import { fdwKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type FDWImportForeignSchemaVariables = {
  branch?: Branch
  serverName: string
  sourceSchema: string
  targetSchema: string
}

export function getImportForeignSchemaSql({
  serverName,
  sourceSchema,
  targetSchema,
}: Pick<FDWImportForeignSchemaVariables, 'serverName' | 'sourceSchema' | 'targetSchema'>) {
  const sql = /* SQL */ `
  import foreign schema "${sourceSchema}" from server ${serverName} into ${targetSchema};
`
  return sql
}

export async function importForeignSchema({ branch, ...rest }: FDWImportForeignSchemaVariables) {
  const sql = wrapWithTransaction(getImportForeignSchemaSql(rest))
  const { result } = await executeSql({ branch, sql })
  return result
}

type ImportForeignSchemaData = Awaited<ReturnType<typeof importForeignSchema>>

export const useFDWImportForeignSchemaMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ImportForeignSchemaData, ResponseError, FDWImportForeignSchemaVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ImportForeignSchemaData, ResponseError, FDWImportForeignSchemaVariables>(
    (vars) => importForeignSchema(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables

        await Promise.all([
          queryClient.invalidateQueries(
            fdwKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
            { refetchType: 'all' }
          ),
          queryClient.invalidateQueries(
            entityTypeKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
          ),
          queryClient.invalidateQueries(
            foreignTableKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
          ),
          queryClient.invalidateQueries(
            vaultSecretsKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
          ),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to import schema for foreign data wrapper: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
