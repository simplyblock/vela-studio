import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { secretsKeys } from './keys'

export type SecretsDeleteVariables = {
  orgSlug?: string
  projectRef?: string
  secrets: string[]
}

export async function deleteSecrets({ orgSlug, projectRef, secrets }: SecretsDeleteVariables) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await del('/platform/organizations/{slug}/projects/{ref}/secrets', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    body: secrets,
  })

  if (error) handleError(error)
  return data
}

type SecretsDeleteData = Awaited<ReturnType<typeof deleteSecrets>>

export const useSecretsDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SecretsDeleteData, ResponseError, SecretsDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SecretsDeleteData, ResponseError, SecretsDeleteVariables>(
    (vars) => deleteSecrets(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef } = variables
        await queryClient.invalidateQueries(secretsKeys.list(orgSlug, projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete secrets: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
