import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { LogDrainType } from 'components/interfaces/LogDrains/LogDrains.constants'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { logDrainsKeys } from './keys'

export type LogDrainUpdateVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  token?: string
  name: string
  description?: string
  type: LogDrainType
  config: Record<string, never>
}

export async function updateLogDrain(payload: LogDrainUpdateVariables) {
  if (!payload.token) {
    throw new Error('Token is required')
  }

  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/log-drains/{token}',
    {
      params: {
        path: {
          slug: payload.orgRef,
          ref: payload.projectRef,
          branch: payload.branchRef,
          token: payload.token,
        },
      },
      body: {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        config: payload.config as any,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type LogDrainUpdateData = Awaited<ReturnType<typeof updateLogDrain>>

export const useUpdateLogDrainMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<LogDrainUpdateData, ResponseError, LogDrainUpdateVariables>(
    (vars) => updateLogDrain(vars),
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
