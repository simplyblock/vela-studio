import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { Branch } from 'api-types/types'

type DatabaseCronJobsCountVariables = {
  branch?: Branch
}

const cronJobCountSql = `select count(jobid) from cron.job;`.trim()

export async function getDatabaseCronJobsCount({ branch }: DatabaseCronJobsCountVariables) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql({
    branch,
    sql: cronJobCountSql,
    queryKey: ['cron-jobs-count'],
  })
  return result[0].count
}

export type DatabaseCronJobData = number
export type DatabaseCronJobError = ResponseError

export const useCronJobsCountQuery = <TData = DatabaseCronJobData>(
  { branch }: DatabaseCronJobsCountVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.count(branch?.organization_id, branch?.project_id, branch?.id),
    () => getDatabaseCronJobsCount({ branch }),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
