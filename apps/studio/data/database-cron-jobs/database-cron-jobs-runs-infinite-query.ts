import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { last } from 'lodash'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseCronJobRunsVariables = {
  branch?: Branch
  jobId: number
}

export type CronJobRun = {
  jobid: number
  runid: number
  job_pid: number
  database: string
  username: string
  command: string
  // statuses https://github.com/citusdata/pg_cron/blob/f5d111117ddc0f4d83a1bad34d61b857681b6720/include/job_metadata.h#L20
  status: 'starting' | 'running' | 'sending' | 'connecting' | 'succeeded' | 'failed'
  return_message: string
  start_time: string
  end_time: string
}

export const CRON_JOB_RUNS_PAGE_SIZE = 30

export async function getDatabaseCronJobRuns({
  branch,
  jobId,
  afterTimestamp,
}: DatabaseCronJobRunsVariables & { afterTimestamp: string }) {
  if (!branch) throw new Error('Branch is required')

  let query = `
    SELECT * FROM cron.job_run_details
    WHERE
      jobid = '${jobId}'
      ${afterTimestamp ? `AND start_time < '${afterTimestamp}'` : ''}
    ORDER BY start_time DESC
    LIMIT ${CRON_JOB_RUNS_PAGE_SIZE}`

  const { result } = await executeSql({
    branch,
    sql: query,
  })
  return result
}

type DatabaseCronJobRunData = CronJobRun[]
type DatabaseCronJobError = ResponseError

export const useCronJobRunsInfiniteQuery = <TData = DatabaseCronJobRunData>(
  { branch, jobId }: DatabaseCronJobRunsVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<DatabaseCronJobRunData, DatabaseCronJobError, TData> = {}
) =>
  useInfiniteQuery<DatabaseCronJobRunData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.runsInfinite(
      branch?.organization_id,
      branch?.project_id,
      branch?.id,
      jobId,
      { status }
    ),
    ({ pageParam }) => {
      return getDatabaseCronJobRuns({
        branch,
        jobId,
        afterTimestamp: pageParam,
      })
    },
    {
      staleTime: 0,
      enabled: enabled && typeof branch !== 'undefined',

      getNextPageParam(lastPage) {
        const hasNextPage = lastPage.length <= CRON_JOB_RUNS_PAGE_SIZE
        if (!hasNextPage) return undefined
        return last(lastPage)?.start_time
      },
      ...options,
    }
  )
