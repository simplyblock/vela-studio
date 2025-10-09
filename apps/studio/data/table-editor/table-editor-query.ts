import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableEditorKeys } from './keys'
import { getTableEditorSql } from './table-editor-query-sql'
import { Entity } from './table-editor-types'
import { Branch } from 'api-types/types'

type TableEditorArgs = {
  id?: number
}

export type TableEditorVariables = TableEditorArgs & {
  branch?: Branch
}

export async function getTableEditor({ branch, id }: TableEditorVariables, signal?: AbortSignal) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getTableEditorSql(id)
  const { result } = await executeSql(
    {
      branch,
      sql,
      queryKey: ['table-editor', id],
    },
    signal
  )

  return (result[0]?.entity ?? undefined) as Entity | undefined
}

export type TableEditorData = Awaited<ReturnType<typeof getTableEditor>>
export type TableEditorError = ExecuteSqlError

export const useTableEditorQuery = <TData = TableEditorData>(
  { branch, id }: TableEditorVariables,
  { enabled = true, ...options }: UseQueryOptions<TableEditorData, TableEditorError, TData> = {}
) =>
  useQuery<TableEditorData, TableEditorError, TData>(
    tableEditorKeys.tableEditor(branch?.organization_id, branch?.project_id, branch?.id, id),
    ({ signal }) => getTableEditor({ branch, id }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    }
  )

export function prefetchTableEditor(client: QueryClient, { branch, id }: TableEditorVariables) {
  return client.fetchQuery(
    tableEditorKeys.tableEditor(branch?.organization_id, branch?.project_id, branch?.id, id),
    ({ signal }) =>
      getTableEditor(
        {
          branch,
          id,
        },
        signal
      )
  )
}
