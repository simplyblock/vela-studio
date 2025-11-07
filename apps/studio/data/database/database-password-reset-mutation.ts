import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from '../branches/keys'

export type DatabasePasswordResetVariables = {
  slug: string
  ref: string
  branch: string
  password: string
}

export async function resetDatabasePassword({
  slug,
  ref,
  branch,
  password,
}: DatabasePasswordResetVariables) {
  if (!ref) return console.error('Project ref is required')

  const { data, error } = await patch('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/db-password', {
    params: {
      path: {
        slug,
        ref,
        branch,
      },
    },
    body: { password },
  })

  if (error) handleError(error)
  return data
}

type DatabasePasswordResetData = Awaited<ReturnType<typeof resetDatabasePassword>>

export const useDatabasePasswordResetMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<DatabasePasswordResetData, ResponseError, DatabasePasswordResetVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<DatabasePasswordResetData, ResponseError, DatabasePasswordResetVariables>(
    (vars) => resetDatabasePassword(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(
          branchKeys.detail(variables.slug, variables.ref, variables.branch)
        )

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to reset database password: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
