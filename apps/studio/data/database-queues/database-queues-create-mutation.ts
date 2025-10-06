import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { tableKeys } from 'data/tables/keys'
import { Branch } from 'api-types/types'

export type DatabaseQueueCreateVariables = {
  branch: Branch
  name: string
  type: 'basic' | 'partitioned' | 'unlogged'
  enableRls: boolean
  configuration?: {
    partitionInterval?: number
    retentionInterval?: number
  }
}

export async function createDatabaseQueue({
  branch,
  name,
  type,
  enableRls,
  configuration,
}: DatabaseQueueCreateVariables) {
  const { partitionInterval, retentionInterval } = configuration ?? {}

  const query =
    type === 'partitioned'
      ? `select from pgmq.create_partitioned('${name}', '${partitionInterval}', '${retentionInterval}');`
      : type === 'unlogged'
        ? `SELECT pgmq.create_unlogged('${name}');`
        : `SELECT pgmq.create('${name}');`

  const { result } = await executeSql({
    branch,
    sql: `${query} ${enableRls ? `alter table pgmq."q_${name}" enable row level security;` : ''}`.trim(),
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueCreateData = Awaited<ReturnType<typeof createDatabaseQueue>>

export const useDatabaseQueueCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueueCreateData, ResponseError, DatabaseQueueCreateVariables>(
    (vars) => createDatabaseQueue(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          databaseQueuesKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        )
        queryClient.invalidateQueries(
          tableKeys.list(branch?.organization_id, branch?.project_id, branch?.id, 'pgmq')
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create database queue: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
