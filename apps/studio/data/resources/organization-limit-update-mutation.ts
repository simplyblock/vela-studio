import { components } from '../vela/vela-schema'
import { handleError, post } from '../fetchers'
import { ResponseError } from '../../types'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { resourcesKeys } from './keys'
import { toast } from 'sonner'

interface OrganizationLimitUpdateVariables {
  orgSlug: string
  limit: components['schemas']['ProvLimitPayload']
}

async function updateOrganizationLimit(
  { orgSlug, limit }: OrganizationLimitUpdateVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post('/platform/organizations/{slug}/resources/limits', {
    params: {
      path: {
        slug: orgSlug,
      },
    },
    body: limit,
    signal,
  })

  if (error) handleError(error)
  return data
}

export type OrganizationLimitUpdateData = Awaited<ReturnType<typeof updateOrganizationLimit>>

export const useOrganizationLimitUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationLimitUpdateData, ResponseError, OrganizationLimitUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<OrganizationLimitUpdateData, ResponseError, OrganizationLimitUpdateVariables>(
    (vars) => updateOrganizationLimit(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(resourcesKeys.organizationLimits(variables.orgSlug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update organization limit: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
