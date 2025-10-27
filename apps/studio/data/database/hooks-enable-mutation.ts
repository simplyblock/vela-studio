import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { invalidateSchemasQuery } from './schemas-query'
import { Branch } from 'data/branches/branch-query'

export type HooksEnableVariables = {
  branch: Branch
}

export async function enableDatabaseWebhooks({ branch }: HooksEnableVariables) {
  const { data, error } = await post('/platform/database/{ref}/hook-enable', {
    params: {
      path: {
        ref: branch.project_id,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type HooksEnableData = Awaited<ReturnType<typeof enableDatabaseWebhooks>>

export const useHooksEnableMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<HooksEnableData, ResponseError, HooksEnableVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<HooksEnableData, ResponseError, HooksEnableVariables>(
    (vars) => enableDatabaseWebhooks(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await onSuccess?.(data, variables, context)
        await invalidateSchemasQuery(
          queryClient,
          branch.organization_id,
          branch.project_id,
          branch.id
        )
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to enable webhooks: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
