import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { configKeys } from 'data/config/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseExtensionDisableVariables = {
  branch?: Branch
  id: string
  cascade?: boolean
}

export async function disableDatabaseExtension({
  branch,
  id,
  cascade,
}: DatabaseExtensionDisableVariables) {
  const { sql } = pgMeta.extensions.remove(id, { cascade })
  const { result } = await executeSql({
    branch,
    sql,
    queryKey: ['extension', 'delete', id],
  })

  return result
}

type DatabaseExtensionDisableData = Awaited<ReturnType<typeof disableDatabaseExtension>>

export const useDatabaseExtensionDisableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseExtensionDisableData,
    ResponseError,
    DatabaseExtensionDisableVariables
  >((vars) => disableDatabaseExtension(vars), {
    async onSuccess(data, variables, context) {
      const { branch } = variables
      await Promise.all([
        queryClient.invalidateQueries(
          databaseExtensionsKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        ),
        queryClient.invalidateQueries(
          configKeys.upgradeEligibility(branch?.organization_id, branch?.project_id, branch?.id)
        ),
      ])
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to disable database extension: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
