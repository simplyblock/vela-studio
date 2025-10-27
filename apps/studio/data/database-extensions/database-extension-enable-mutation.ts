import pgMeta from '@supabase/pg-meta'
import { ident } from '@supabase/pg-meta/src/pg-format'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseExtensionEnableVariables = {
  branch: Branch
  schema: string
  name: string
  version: string
  cascade?: boolean
  createSchema?: boolean
}

export async function enableDatabaseExtension({
  branch,
  schema,
  name,
  version,
  cascade = false,
  createSchema = false,
}: DatabaseExtensionEnableVariables) {
  const { sql } = pgMeta.extensions.create({ schema, name, version, cascade })
  const { result } = await executeSql({
    branch,
    sql: createSchema ? `create schema if not exists ${ident(schema)}; ${sql}` : sql,
    queryKey: ['extension', 'create'],
  })

  return result
}

type DatabaseExtensionEnableData = Awaited<ReturnType<typeof enableDatabaseExtension>>

export const useDatabaseExtensionEnableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseExtensionEnableData, ResponseError, DatabaseExtensionEnableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseExtensionEnableData, ResponseError, DatabaseExtensionEnableVariables>(
    (vars) => enableDatabaseExtension(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          databaseExtensionsKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to enable database extension: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
