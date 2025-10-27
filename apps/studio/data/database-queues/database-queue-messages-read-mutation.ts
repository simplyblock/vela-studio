import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseQueueMessageReadVariables = {
  branch: Branch
  queryName: string
  duration: number
  messageId: number
}

export async function readDatabaseQueueMessage({
  branch,
  queryName,
  messageId,
  duration,
}: DatabaseQueueMessageReadVariables) {
  const { result } = await executeSql({
    branch,
    sql: `select * from pgmq.set_vt('${queryName}', ${messageId}, ${duration})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageReadData = Awaited<ReturnType<typeof readDatabaseQueueMessage>>

export const useDatabaseQueueMessageReadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueMessageReadData,
    ResponseError,
    DatabaseQueueMessageReadVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageReadData,
    ResponseError,
    DatabaseQueueMessageReadVariables
  >((vars) => readDatabaseQueueMessage(vars), {
    async onSuccess(data, variables, context) {
      const { branch, queryName } = variables
      await queryClient.invalidateQueries(
        databaseQueuesKeys.getMessagesInfinite(
          branch?.organization_id,
          branch?.project_id,
          branch?.id,
          queryName
        )
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to postpone database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
