import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type UserDeleteVariables = {
  orgId: string
  projectId: string
  branchId: string
  userId: string
  skipInvalidation?: boolean
}

export async function deleteUser({ orgId, projectId, branchId, userId }: UserDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/{id}', {
    params: {
      path: {
        slug: orgId,
        ref: projectId,
        branch: branchId,
        id: userId,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type UserDeleteData = Awaited<ReturnType<typeof deleteUser>>

export const useUserDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserDeleteData, ResponseError, UserDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserDeleteData, ResponseError, UserDeleteVariables>(
    (vars) => deleteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgId, projectId, branchId, skipInvalidation = false } = variables

        if (!skipInvalidation) {
          await Promise.all([
            queryClient.invalidateQueries(
              authKeys.usersInfinite(orgId, projectId, branchId)
            ),
            queryClient.invalidateQueries(
              authKeys.usersCount(orgId, projectId, branchId)
            ),
          ])
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
