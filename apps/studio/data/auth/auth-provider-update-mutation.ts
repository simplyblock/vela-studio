import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { components } from 'api-types'

type AuthProviderUpdateBody = components['schemas']['AuthProviderUpdateBody']

export type AuthProviderUpdateVariables = {
  orgId: string
  projectId: string
  branchId: string
  authProviderName: string
  update: AuthProviderUpdateBody
}

export async function updateAuthProvider({
  orgId,
  projectId,
  branchId,
  authProviderName,
  update,
}: AuthProviderUpdateVariables) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/providers/{name}',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
          name: authProviderName,
        },
      },
      body: update,
    }
  )
  if (error) handleError(error)
  return data
}

type AuthProviderUpdateData = Awaited<ReturnType<typeof updateAuthProvider>>

export const useAuthProviderUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthProviderUpdateData, ResponseError, AuthProviderUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthProviderUpdateData, ResponseError, AuthProviderUpdateVariables>(
    (vars) => updateAuthProvider(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authProviders(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update auth provider: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
