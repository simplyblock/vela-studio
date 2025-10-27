import type { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import { useCallback } from 'react'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type TablesVariables = {
  branch?: Branch
  schema?: string
  /**
   * Defaults to false
   */
  includeColumns?: boolean
  sortByProperty?: keyof PostgresTable
}

export async function getTables(
  { branch, schema, includeColumns = false, sortByProperty = 'name' }: TablesVariables,
  signal?: AbortSignal
) {
  if (!branch) {
    throw new Error('branch is required')
  }

  let queryParams: Record<string, string> = {
    //include_columns is a string, even though it's true or false
    include_columns: `${includeColumns}`,
  }
  if (schema) {
    queryParams.included_schemas = schema
  }

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/tables',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: queryParams as any,
      },
      signal,
    }
  )

  if (!Array.isArray(data) && error) handleError(error)

  // Sort the data if the sortByName option is true
  if (Array.isArray(data) && sortByProperty) {
    return sortBy(data, (t) => t[sortByProperty]) as PostgresTable[]
  }

  return data as Omit<PostgresTable, 'columns'>[]
}

export type TablesData = Awaited<ReturnType<typeof getTables>>
export type TablesError = ResponseError

export const useTablesQuery = <TData = TablesData>(
  { branch, schema, includeColumns }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<TablesData, TablesError, TData> = {}
) => {
  return useQuery<TablesData, TablesError, TData>(
    tableKeys.list(branch?.organization_id, branch?.project_id, branch?.id, schema, includeColumns),
    ({ signal }) => getTables({ branch, schema, includeColumns }, signal),
    { enabled: enabled && typeof branch !== 'undefined', ...options }
  )
}

/**
 * useGetTables
 * Tries to get tables from the react-query cache, or loads it from the server if it's not cached.
 */
export function useGetTables({ branch }: TablesVariables) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.fetchQuery({
        queryKey: tableKeys.list(
          branch?.organization_id,
          branch?.project_id,
          branch?.id,
          schema,
          includeColumns
        ),
        queryFn: ({ signal }) => getTables({ branch, schema, includeColumns }, signal),
      })
    },
    [branch, queryClient]
  )
}

export function usePrefetchTables({ branch }: TablesVariables) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.prefetchQuery({
        queryKey: tableKeys.list(
          branch?.organization_id,
          branch?.project_id,
          branch?.id,
          schema,
          includeColumns
        ),
        queryFn: ({ signal }) => getTables({ branch, schema, includeColumns }, signal),
      })
    },
    [branch, queryClient]
  )
}
