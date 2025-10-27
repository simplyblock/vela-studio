import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import minify from 'pg-minify'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { QUEUES_SCHEMA } from './database-queues-toggle-postgrest-mutation'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseQueuesVariables = {
  branch?: Branch
}

// [Joshen] Check if all the relevant functions exist to indicate whether PGMQ has been exposed through PostgREST
const queueSqlQuery = minify(/**SQL */ `
  SELECT exists (select schema_name FROM information_schema.schemata WHERE schema_name = '${QUEUES_SCHEMA}');
`)

export async function getDatabaseQueuesExposePostgrestStatus({ branch }: DatabaseQueuesVariables) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql({
    branch,
    sql: queueSqlQuery,
  })
  return result[0].exists as boolean
}

export type DatabaseQueueData = boolean
export type DatabaseQueueError = ResponseError

export const useQueuesExposePostgrestStatusQuery = <TData = DatabaseQueueData>(
  { branch }: DatabaseQueuesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseQueueData, DatabaseQueueError, TData> = {}
) =>
  useQuery<DatabaseQueueData, DatabaseQueueError, TData>(
    databaseQueuesKeys.exposePostgrestStatus(
      branch?.organization_id,
      branch?.project_id,
      branch?.id
    ),
    () => getDatabaseQueuesExposePostgrestStatus({ branch }),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
