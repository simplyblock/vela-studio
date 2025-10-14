import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { Branch } from 'api-types/types'

export type UserCreateVariables = {
  branch: Branch
  user: {
    email: string
    password: string
    autoConfirmUser: boolean
    forcePasswordUpdate: boolean
  }
}

export async function createUser({ branch, user }: UserCreateVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
      },
      body: {
        email: user.email,
        password: user.password,
        email_confirm: user.autoConfirmUser,
        force_password_update: user.forcePasswordUpdate
      },
    }
  )
  if (error) handleError(error)
  return data
}

type UserCreateData = Awaited<ReturnType<typeof createUser>>

export const useUserCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserCreateData, ResponseError, UserCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserCreateData, ResponseError, UserCreateVariables>(
    (vars) => createUser(vars),
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
          toast.error(`Failed to create user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
