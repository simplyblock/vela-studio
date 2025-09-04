import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseError } from 'types'
import { sslEnforcementKeys } from './keys'
import { handleError, put } from 'data/fetchers'

export type SSLEnforcementUpdateVariables = {
  orgSlug: string
  projectRef: string
  requestedConfig: { database: boolean }
}

export type SSLEnforcementUpdateResponse = {
  appliedSuccessfully: boolean
  currentConfig: { database: boolean }
  error?: any
}

export async function updateSSLEnforcement({
  orgSlug,
  projectRef,
  requestedConfig,
}: SSLEnforcementUpdateVariables) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await put(`/platform/organizations/{slug}/projects/{ref}/ssl-enforcement`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    body: { requestedConfig },
  })

  if (error) handleError(error)
  return data
}

type SSLEnforcementUpdateData = Awaited<ReturnType<typeof updateSSLEnforcement>>

export const useSSLEnforcementUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SSLEnforcementUpdateData, ResponseError, SSLEnforcementUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<SSLEnforcementUpdateData, ResponseError, SSLEnforcementUpdateVariables>(
    (vars) => updateSSLEnforcement(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef } = variables
        await queryClient.invalidateQueries(sslEnforcementKeys.list(orgSlug, projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update SSL enforcement: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
