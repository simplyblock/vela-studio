import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseQueuesVariables = {
  branch?: Branch
}

export type PostgresQueue = {
  queue_name: string
  is_partitioned: boolean
  is_unlogged: boolean
  created_at: string
}

const queueSqlQuery = `select * from pgmq.list_queues();`

export async function getDatabaseQueues({ branch }: DatabaseQueuesVariables) {
  if (!branch) throw new Error('Branch is required')

  const { result } = await executeSql({
    branch,
    sql: queueSqlQuery,
  })
  return result
}

export type DatabaseQueueData = PostgresQueue[]
export type DatabaseQueueError = ResponseError

export const useQueuesQuery = <TData = DatabaseQueueData>(
  { branch }: DatabaseQueuesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseQueueData, DatabaseQueueError, TData> = {}
) =>
  useQuery<DatabaseQueueData, DatabaseQueueError, TData>(
    databaseQueuesKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    () => getDatabaseQueues({ branch }),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
