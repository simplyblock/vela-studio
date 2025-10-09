import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { replicationKeys } from './keys'
import { handleError, post } from 'data/fetchers'

export type CreateTenantSourceParams = {
  orgId: string
  projectId: string
}

async function createTenantSource(
  { orgId, projectId }: CreateTenantSourceParams,
  signal?: AbortSignal
) {
  if (!orgId) throw new Error('orgId is required')
  if (!projectId) throw new Error('projectId is required')

  const { data, error } = await post('/platform/replication/{ref}/tenants-sources', {
    params: {
      path: {
        ref: projectId,
      },
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

type CreateTenantSourceData = Awaited<ReturnType<typeof createTenantSource>>

export const useCreateTenantSourceMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<CreateTenantSourceData, ResponseError, CreateTenantSourceParams>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<CreateTenantSourceData, ResponseError, CreateTenantSourceParams>(
    (vars) => createTenantSource(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId } = variables
        await queryClient.invalidateQueries(replicationKeys.sources(orgId, projectId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create tenant or source: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
