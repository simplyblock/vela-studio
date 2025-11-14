import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ArrayElement, ResponseError } from 'types'
import { components } from '../vela/vela-schema'
import { organizationKeys } from './keys'

export type RoleType = components['schemas']['RoleUpdate']['role_type']

export type RolePermission = ArrayElement<components['schemas']['RoleUpdate']['access_rights']>

export type OrganizationRoleUpdateVariables = {
  slug: string
  roleId: string
  name: string
  roleType: RoleType
  permissions: RolePermission[]
  description?: string
}

export async function updateOrganizationRole({
  slug,
  roleId,
  name,
  roleType,
  permissions,
  description,
}: OrganizationRoleUpdateVariables) {
  const { data, error } = await put('/platform/organizations/{slug}/roles/{id}', {
    params: {
      path: {
        slug,
        id: roleId,
      },
    },
    body: {
      name,
      role_type: roleType,
      description,
      access_rights: permissions,
    },
  })

  if (error) handleError(error)
  return data
}

type OrganizationRoleUpdateData = Awaited<ReturnType<typeof updateOrganizationRole>>

export const useOrganizationRoleUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationRoleUpdateData, ResponseError, OrganizationRoleUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationRoleUpdateData, ResponseError, OrganizationRoleUpdateVariables>(
    (vars) => updateOrganizationRole(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(permissionKeys.list_permissions())
        await queryClient.invalidateQueries(permissionKeys.list_roles())
        await queryClient.invalidateQueries(organizationKeys.roles(variables.slug))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update organization role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
