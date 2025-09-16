import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { secretsKeys } from './keys'

export type SecretsCreateVariables = {
  orgSlug?: string
  projectRef?: string
  secrets: { name: string; value: string }[]
}

export async function createSecrets({ orgSlug, projectRef, secrets }: SecretsCreateVariables) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await post('/platform/organizations/{slug}/projects/{ref}/secrets', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    body: secrets,
  })

  if (error) handleError(error)
  return data
}

type SecretsCreateData = Awaited<ReturnType<typeof createSecrets>>

export const useSecretsCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SecretsCreateData, ResponseError, SecretsCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<SecretsCreateData, ResponseError, SecretsCreateVariables>(
    (vars) => createSecrets(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef } = variables
        await queryClient.invalidateQueries(secretsKeys.list(orgSlug, projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create secrets: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
