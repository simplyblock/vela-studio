import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { executeSql } from 'data/sql/execute-sql-query'
import { lintKeys } from 'data/lint/keys'
import { tableEditorKeys } from 'data/table-editor/keys'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'
import { Branch } from 'api-types/types'

export type UpdateTableBody = components['schemas']['UpdateTableBody']

export type TableUpdateVariables = {
  branch: Branch
  id: number
  name: string
  schema: string
  payload: UpdateTableBody
}

export async function updateTable({ branch, id, name, schema, payload }: TableUpdateVariables) {
  const { sql } = pgMeta.tables.update({ id, name, schema }, payload)

  const { result } = await executeSql<void>({
    branch,
    sql,
    queryKey: ['table', 'update', id],
  })

  return result
}

type TableUpdateData = Awaited<ReturnType<typeof updateTable>>

export const useTableUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableUpdateData, ResponseError, TableUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableUpdateData, ResponseError, TableUpdateVariables>(
    (vars) => updateTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch, schema, id } = variables
        await Promise.all([
          queryClient.invalidateQueries(
            tableEditorKeys.tableEditor(branch.organization_id, branch.project_id, branch.id, id)
          ),
          queryClient.invalidateQueries(
            tableKeys.list(branch.organization_id, branch.project_id, branch.id, schema)
          ),
          queryClient.invalidateQueries(lintKeys.lint(branch.organization_id, branch.project_id, branch.id)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
