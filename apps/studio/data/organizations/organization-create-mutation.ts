import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationCreateVariables = {
  name: string
}

export async function createOrganization({ name }: OrganizationCreateVariables) {
  const { data, error } = await post('/platform/organizations', {
    body: {
      name,
      max_backups: 100, // FIXME: Should this be a configurable value?
      env_types: ['Production', 'Staging', 'Test', 'Development'],
    },
  })

  if (error) handleError(error)
  return data
}

type OrganizationCreateData = Awaited<ReturnType<typeof createOrganization>>

export const useOrganizationCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationCreateData, ResponseError, OrganizationCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationCreateData, ResponseError, OrganizationCreateVariables>(
    (vars) => createOrganization(vars),
    {
      async onSuccess(data, variables, context) {
        if (data && !('pending_payment_intent_secret' in data)) {
          // [Joshen] We're manually updating the query client here as the org's subscription is
          // created async, and the invalidation will happen too quick where the GET organizations
          // endpoint will error out with a 500 since the subscription isn't created yet.
          queryClient.setQueriesData(
            {
              queryKey: organizationKeys.list(),
              exact: true,
            },
            (prev: any) => {
              if (!prev) return prev
              return [...prev, data]
            }
          )

          await queryClient.invalidateQueries(permissionKeys.list_permissions())
          await queryClient.invalidateQueries(permissionKeys.list_roles())
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create organization: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
