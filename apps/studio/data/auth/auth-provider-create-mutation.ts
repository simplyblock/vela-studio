import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthProviderCreateVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  create: {
    alias: string
    authorizationUrl: string
    clientId: string
    displayName: string
    issuer: string
    tokenUrl: string
    userInfoUrl: string
  }
}

export async function createAuthProvider({
  orgRef,
  projectRef,
  branchRef,
  create,
}: AuthProviderCreateVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/providers',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
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
        const { orgRef, projectRef, branchRef } = variables
        await queryClient.invalidateQueries(authKeys.authProviders(orgRef, projectRef, branchRef))
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
