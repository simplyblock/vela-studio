import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationUpdateVariables = {
  slug: string
  name?: string
  env_types?: string[]
  max_backups?: number
}

export async function updateOrganization({
  slug,
  name,
  env_types,
  max_backups,
}: OrganizationUpdateVariables) {
  const { data, error } = await patch('/platform/organizations/{slug}', {
    params: { path: { slug } },
    body: {
      name,
      max_backups,
      env_types,
    },
  })

  if (error) handleError(error)
  return data
}

type OrganizationUpdateData = Awaited<ReturnType<typeof updateOrganization>>

export const useOrganizationUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationUpdateData, ResponseError, OrganizationUpdateVariables>(
    (vars) => updateOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries({ queryKey: organizationKeys.list() })
        await queryClient.invalidateQueries({ queryKey: organizationKeys.detail(variables.slug) })
        if (onSuccess) {
          await onSuccess(data, variables, context)
        }
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
