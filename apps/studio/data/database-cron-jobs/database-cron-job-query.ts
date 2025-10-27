import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { CronJob } from './database-cron-jobs-infinite-query'
import { databaseCronJobsKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseCronJobVariables = {
  branch?: Branch
  id?: number
  name?: string
}

export async function getDatabaseCronJob({ branch, id, name }: DatabaseCronJobVariables) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql({
    branch,
    sql: !!id
      ? `SELECT * FROM cron.job where jobid = ${id};`
      : `SELECT * FROM cron.job where jobname = '${name}';`,
    queryKey: ['cron-job', id],
  })

  return result[0]
}

export type DatabaseCronJobData = CronJob
export type DatabaseCronJobError = ResponseError

export const useCronJobQuery = <TData = DatabaseCronJobData>(
  { branch, id, name }: DatabaseCronJobVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.job(branch?.organization_id, branch?.project_id, branch?.id, id ?? name),
    () => getDatabaseCronJob({ branch, id }),
    {
      enabled:
        enabled &&
        typeof branch !== 'undefined' &&
        (typeof id !== 'undefined' || typeof name !== 'undefined'),
      ...options,
    }
  )
