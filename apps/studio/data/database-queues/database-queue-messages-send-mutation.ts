import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabaseQueueMessageSendVariables = {
  branch: Branch
  queueName: string
  payload: string
  delay: number
}

export async function sendDatabaseQueueMessage({
  branch,
  queueName,
  payload,
  delay,
}: DatabaseQueueMessageSendVariables) {
  const { result } = await executeSql({
    branch,
    sql: `select * from pgmq.send( '${queueName}', '${payload}', ${delay})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageSendData = Awaited<ReturnType<typeof sendDatabaseQueueMessage>>

export const useDatabaseQueueMessageSendMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueMessageSendData,
    ResponseError,
    DatabaseQueueMessageSendVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageSendData,
    ResponseError,
    DatabaseQueueMessageSendVariables
  >((vars) => sendDatabaseQueueMessage(vars), {
    async onSuccess(data, variables, context) {
      const { branch, queueName } = variables
      await queryClient.invalidateQueries(
        databaseQueuesKeys.getMessagesInfinite(
          branch?.organization_id,
          branch?.project_id,
          branch?.id,
          queueName
        )
      )
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to send database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
