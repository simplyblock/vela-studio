import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { realtimeKeys } from './keys'

export type RealtimeConfigurationUpdateVariables = {
  orgId: string
  projectId: string
} & components['schemas']['UpdateRealtimeConfigBody']

export async function updateRealtimeConfiguration({
  orgId,
  projectId,
  private_only,
  connection_pool,
  max_concurrent_users,
  max_events_per_second,
  max_bytes_per_second,
  max_channels_per_client,
  max_joins_per_second,
}: RealtimeConfigurationUpdateVariables) {
  if (!orgId) return console.error('Org id is required')
  if (!projectId) return console.error('Project id is required')

  const { data, error } = await patch(
    `/platform/organizations/{slug}/projects/{ref}/config/realtime`,
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
        },
      },
      body: {
        private_only,
        connection_pool,
        max_concurrent_users,
        max_events_per_second,
        max_bytes_per_second,
        max_channels_per_client,
        max_joins_per_second,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type RealtimeConfigurationUpdateData = Awaited<ReturnType<typeof updateRealtimeConfiguration>>

export const useRealtimeConfigurationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    RealtimeConfigurationUpdateData,
    ResponseError,
    RealtimeConfigurationUpdateVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    RealtimeConfigurationUpdateData,
    ResponseError,
    RealtimeConfigurationUpdateVariables
  >((vars) => updateRealtimeConfiguration(vars), {
    async onSuccess(data, variables, context) {
      const { orgId, projectId } = variables
      await queryClient.invalidateQueries(realtimeKeys.configuration(projectId))
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update realtime configuration: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
