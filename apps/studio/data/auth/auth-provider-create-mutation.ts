import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { components } from 'api-types'

type AuthProviderCreateBody = components['schemas']['AuthProviderCreateBody']

export type AuthProviderCreateVariables = {
  orgId: string
  projectId: string
  branchId: string
  create: AuthProviderCreateBody
}

export async function createAuthProvider({
  orgId,
  projectId,
  branchId,
  create,
}: AuthProviderCreateVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/providers',
    {
      params: {
        path: {
          slug: orgId,
          ref: projectId,
          branch: branchId,
        },
      },
      body: create,
    }
  )
  if (error) handleError(error)
  return data
}

type AuthProviderCreateData = Awaited<ReturnType<typeof createAuthProvider>>

export const useAuthProviderCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthProviderCreateData, ResponseError, AuthProviderCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthProviderCreateData, ResponseError, AuthProviderCreateVariables>(
    (vars) => createAuthProvider(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authProviders(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create auth provider: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
