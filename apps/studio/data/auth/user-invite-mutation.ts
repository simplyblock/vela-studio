import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { Branch } from 'api-types/types'

export type UserInviteVariables = {
  branch: Branch
  email: string
}

export async function inviteUser({ branch, email }: UserInviteVariables) {
  const { data, error } = await post('/platform/auth/{ref}/invite', {
    params: {
      path: {
        ref: branch.project_id,
      },
    },
    body: { email },
  })
  if (error) handleError(error)
  return data
}

type UserInviteData = Awaited<ReturnType<typeof inviteUser>>

export const useUserInviteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserInviteData, ResponseError, UserInviteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserInviteData, ResponseError, UserInviteVariables>(
    (vars) => inviteUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables

        await Promise.all([
          queryClient.invalidateQueries(
            authKeys.usersInfinite(branch.organization_id, branch.project_id, branch.id)
          ),
          queryClient.invalidateQueries(
            authKeys.usersCount(branch.organization_id, branch.project_id, branch.id)
          ),
        ])

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to invite user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
