import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthClientUpdateVariables = {
  orgId: string
  projectId: string
  branchId: string
  client: Partial<components['schemas']['BranchAuthClientResponse']>
}

export async function updateAuthClient({
  orgId,
  projectId,
  branchId,
  client,
}: AuthClientUpdateVariables) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/client',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
        },
      },
      body: {
        ...client,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type AuthClientUpdateData = Awaited<ReturnType<typeof updateAuthClient>>

export const useAuthClientUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthClientUpdateData, ResponseError, AuthClientUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthClientUpdateData, ResponseError, AuthClientUpdateVariables>(
    (vars) => updateAuthClient(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authProviders(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth client configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
