import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'api-types/types/platform'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { AuthVariables } from './types'

export type AuthSMTPUpdateVariables = AuthVariables & {
  config: components['schemas']['TODO CREAT MODEL HERE']
}

export async function updateAuthSMTP({
  orgId,
  projectId,
  branchId,
  config,
}: AuthSMTPUpdateVariables) {
  if (orgId === undefined || projectId === undefined || branchId === undefined) { return }
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/mfa',
    {
      params: {
        path: {
          slug: orgId!,
          ref: projectId!,
          branch: branchId!,
        },
      },
      body: {
        status: status,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type AuthSMTPUpdateData = Awaited<ReturnType<typeof updateAuthSMTP>>

export const useAuthSMTPUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthSMTPUpdateData, ResponseError, AuthSMTPUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthSMTPUpdateData, ResponseError, AuthSMTPUpdateVariables>(
    (vars) => updateAuthSMTP(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authSMTP(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth SMTP configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
