import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, del } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ResponseError } from 'types'

export type OrganizationRoleDeleteVariables = {
  slug: string
  roleId: string
}

export async function deleteOrganizationRole({ slug, roleId }: OrganizationRoleDeleteVariables) {
  const { data, error } = await del('/platform/organizations/{slug}/roles/{id}', {
    params: {
      path: {
        slug,
        id: roleId,
      },
    },
  })

  if (error) handleError(error)
  return data
}

type OrganizationRoleDeleteData = Awaited<ReturnType<typeof deleteOrganizationRole>>

export const useOrganizationRoleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationRoleDeleteData, ResponseError, OrganizationRoleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationRoleDeleteData, ResponseError, OrganizationRoleDeleteVariables>(
    (vars) => deleteOrganizationRole(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(permissionKeys.list_permissions())
        await queryClient.invalidateQueries(permissionKeys.list_roles())

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete organization role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
