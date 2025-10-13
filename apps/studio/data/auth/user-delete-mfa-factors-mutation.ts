import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'

export type UserDeleteMFAFactorsVariables = {
  organization_id: string
  project_id: string
  branch_id: string
  user_id: string
}

export async function deleteMFAFactors({ organization_id, project_id, branch_id, user_id }: UserDeleteMFAFactorsVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/users/{id}/factors', {
    params: {
      path: {
        slug: organization_id,
        ref: project_id,
        branch: branch_id,
        id: user_id,
      },
    },
  })
  if (error) handleError(error)
  return data
}

type UserDeleteMFAFactorsData = Awaited<ReturnType<typeof deleteMFAFactors>>

export const useUserDeleteMFAFactorsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UserDeleteMFAFactorsData, ResponseError, UserDeleteMFAFactorsVariables>(
    (vars) => deleteMFAFactors(vars),
    {
      async onSuccess(data, variables, context) {
        // [Joshen] If we need to invalidate any queries
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete the user's MFA factors: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
