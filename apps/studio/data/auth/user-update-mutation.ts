import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { authKeys } from './keys'
import { Branch } from 'api-types/types'

export type UserUpdateVariables = {
  organization_id: string
  project_id: string
  branch_id: string
  user_id: string
  enabled: boolean
}

export async function updateUser({ organization_id, project_id, branch_id, user_id, enabled }: UserUpdateVariables) {
  const { data, error } = await put('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/{id}', {
    params: {
      path: {
        slug: organization_id,
        ref: project_id,
        branch: branch_id,
        id: user_id,
      },
    },
    body: {
      enabled
    },
  })

  if (error) handleError(error)
  return data
}

type UserUpdateData = Awaited<ReturnType<typeof updateUser>>

export const useUserUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserUpdateData, ResponseError, UserUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UserUpdateData, ResponseError, UserUpdateVariables>(
    (vars) => updateUser(vars),
    {
      async onSuccess(data, variables, context) {
        const { organization_id, project_id, branch_id } = variables
        await queryClient.invalidateQueries(
          authKeys.usersInfinite(organization_id, project_id, branch_id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update user: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
