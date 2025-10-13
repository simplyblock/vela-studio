import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthMFAUpdateVariables = {
  orgId: string
  projectId: string
  branchId: string
  status: 'enabled' | 'verify-enabled' | 'disabled'
}

export async function updateAuthMFA({
  orgId,
  projectId,
  branchId,
  status,
}: AuthMFAUpdateVariables) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/config/mfa',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
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

type AuthMFAUpdateData = Awaited<ReturnType<typeof updateAuthMFA>>

export const useAuthMFAUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthMFAUpdateData, ResponseError, AuthMFAUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthMFAUpdateData, ResponseError, AuthMFAUpdateVariables>(
    (vars) => updateAuthMFA(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authMFA(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth MFA configuration: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
