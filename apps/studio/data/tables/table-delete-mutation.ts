import pgMeta from '@supabase/pg-meta'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { entityTypeKeys } from 'data/entity-types/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { viewKeys } from 'data/views/keys'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type TableDeleteVariables = {
  branch: Branch
  id: number
  name: string
  schema: string
  cascade?: boolean
}

export async function deleteTable({
  branch,
  id,
  name,
  schema,
  cascade = false,
}: TableDeleteVariables) {
  const { sql } = pgMeta.tables.remove({ name, schema }, { cascade })

  const { result } = await executeSql<void>({
    branch,
    sql,
    queryKey: ['table', 'delete', id],
  })

  return result
}

type TableDeleteData = Awaited<ReturnType<typeof deleteTable>>

export const useTableDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<TableDeleteData, ResponseError, TableDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TableDeleteData, ResponseError, TableDeleteVariables>(
    (vars) => deleteTable(vars),
    {
      async onSuccess(data, variables, context) {
        const { id, branch, schema } = variables
        await Promise.all([
          queryClient.invalidateQueries(
            tableEditorKeys.tableEditor(branch.organization_id, branch.project_id, branch.id, id)
          ),
          queryClient.invalidateQueries(
            tableKeys.list(branch.organization_id, branch.project_id, branch.id, schema)
          ),
          queryClient.invalidateQueries(
            entityTypeKeys.list(branch.organization_id, branch.project_id, branch.id)
          ),
          // invalidate all views from this schema
          queryClient.invalidateQueries(
            viewKeys.listBySchema(branch.organization_id, branch.project_id, branch.id, schema)
          ),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete database table: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
