import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { Branch } from 'api-types/types'

export type DiskBreakdownVariables = {
  branch?: Branch
}

type DiskBreakdownResult = {
  db_size_bytes: number
  wal_size_bytes: number
}

export async function getDiskBreakdown(
  { branch }: DiskBreakdownVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql(
    {
      branch,
      sql: `
    SELECT
  (
    SELECT
      SUM(pg_database_size(pg_database.datname)) AS db_size_bytes
    FROM
      pg_database
  ),
  (
    SELECT SUM(size)
    FROM
      pg_ls_waldir()
  ) AS wal_size_bytes`,
    },
    signal
  )

  return result[0] as DiskBreakdownResult
}

export type DiskBreakdownData = Awaited<ReturnType<typeof getDiskBreakdown>>
export type DiskBreakdownError = ResponseError

export const useDiskBreakdownQuery = <TData = DiskBreakdownData>(
  { branch }: DiskBreakdownVariables,
  { enabled = true, ...options }: UseQueryOptions<DiskBreakdownData, DiskBreakdownError, TData> = {}
) =>
  useQuery<DiskBreakdownData, DiskBreakdownError, TData>(
    configKeys.diskBreakdown(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDiskBreakdown({ branch }, signal),
    { enabled: enabled && typeof branch !== 'undefined', ...options }
  )
