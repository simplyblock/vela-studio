import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseQueueMessageDeleteVariables = {
  branch: Branch
  queueName: string
  messageId: number
}

export async function deleteDatabaseQueueMessage({
  branch,
  queueName,
  messageId,
}: DatabaseQueueMessageDeleteVariables) {
  const { result } = await executeSql({
    branch,
    sql: `SELECT * FROM pgmq.delete('${queueName}', ${messageId})`,
    queryKey: databaseQueuesKeys.create(),
  })

  return result
}

type DatabaseQueueMessageDeleteData = Awaited<ReturnType<typeof deleteDatabaseQueueMessage>>

export const useDatabaseQueueMessageDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    DatabaseQueueMessageDeleteData,
    ResponseError,
    DatabaseQueueMessageDeleteVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    DatabaseQueueMessageDeleteData,
    ResponseError,
    DatabaseQueueMessageDeleteVariables
  >((vars) => deleteDatabaseQueueMessage(vars), {
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
        toast.error(`Failed to delete database queue message: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
