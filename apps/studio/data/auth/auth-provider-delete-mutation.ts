import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'

export type AuthProviderDeleteVariables = {
  orgId: string
  projectId: string
  branchId: string
  authProviderName: string
}

export async function deleteAuthProvider({
  orgId,
  projectId,
  branchId,
  authProviderName,
}: AuthProviderDeleteVariables) {
  const { data, error } = await del(
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
    }
  )
  if (error) handleError(error)
  return data
}

type AuthProviderDeleteData = Awaited<ReturnType<typeof deleteAuthProvider>>

export const useAuthProviderDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<AuthProviderDeleteData, ResponseError, AuthProviderDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<AuthProviderDeleteData, ResponseError, AuthProviderDeleteVariables>(
    (vars) => deleteAuthProvider(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId } = variables
        await queryClient.invalidateQueries(authKeys.authProviders(orgId, projectId, branchId))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete auth provider: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
