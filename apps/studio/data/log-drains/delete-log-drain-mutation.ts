import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainDeleteVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  token: string
}

export async function deleteLogDrain({
  orgRef,
  projectRef,
  branchRef,
  token,
}: LogDrainDeleteVariables) {
  // @ts-ignore Just sample, TS lint will validate if the endpoint is valid
  const { data, error } = await del(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/log-drains/{token}',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          token,
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

type LogDrainDeleteData = Awaited<ReturnType<typeof deleteLogDrain>>

export const useDeleteLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainDeleteData, ResponseError, LogDrainDeleteVariables>(
    (vars) => deleteLogDrain(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgRef, projectRef, branchRef } = variables

        await queryClient.invalidateQueries(logDrainsKeys.list(orgRef, projectRef, branchRef))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to mutate: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
