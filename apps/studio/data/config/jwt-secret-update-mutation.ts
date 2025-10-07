import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { Branch } from 'api-types/types'

export type JwtSecretUpdateVariables = {
  branch: Branch
  jwtSecret: string
  changeTrackingId: string
}

export async function updateJwtSecret({
  branch,
  jwtSecret,
  changeTrackingId,
}: JwtSecretUpdateVariables) {
  const { data, error } = await patch('/platform/projects/{ref}/config/secrets', {
    params: {
      path: {
        ref: branch.project_id,
      },
    },
    body: {
      jwt_secret: jwtSecret,
      change_tracking_id: changeTrackingId,
    },
  })

  if (error) handleError(error)

  return data
}

type JwtSecretUpdateData = Awaited<ReturnType<typeof updateJwtSecret>>

export const useJwtSecretUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<JwtSecretUpdateData, ResponseError, JwtSecretUpdateVariables>(
    (vars) => updateJwtSecret(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await queryClient.invalidateQueries(
          configKeys.jwtSecretUpdatingStatus(branch.organization_id, branch.project_id, branch.id)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        await onError?.(data, variables, context)
      },
      ...options,
    }
  )
}
