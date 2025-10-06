import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseQueuesKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseQueuePurgeVariables = {
  branch: Branch
  queueName: string
}

export async function purgeDatabaseQueue({ branch, queueName }: DatabaseQueuePurgeVariables) {
  const { result } = await executeSql({
    branch,
    sql: `select * from pgmq.purge_queue('${queueName}');`,
    queryKey: databaseQueuesKeys.purge(queueName),
  })

  return result
}

type DatabaseQueuePurgeData = Awaited<ReturnType<typeof purgeDatabaseQueue>>

export const useDatabaseQueuePurgeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabaseQueuePurgeData, ResponseError, DatabaseQueuePurgeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabaseQueuePurgeData, ResponseError, DatabaseQueuePurgeVariables>(
    (vars) => purgeDatabaseQueue(vars),
    {
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
          toast.error(`Failed to purge database queue: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
