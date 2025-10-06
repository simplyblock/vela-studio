import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseCronJobsVariables = {
  branch?: Branch
}

export async function getDatabaseCronTimezone({ branch }: DatabaseCronJobsVariables) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql({
    branch,
    sql: `select setting from pg_settings where name = 'cron.timezone';`,
  })
  return result[0].setting
}

export type DatabaseCronJobError = ResponseError

export const useCronTimezoneQuery = <TData = string>(
  { branch }: DatabaseCronJobsVariables,
  { enabled = true, ...options }: UseQueryOptions<string, DatabaseCronJobError, TData> = {}
) =>
  useQuery<string, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.timezone(branch?.organization_id, branch?.project_id, branch?.id),
    () => getDatabaseCronTimezone({ branch }),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
