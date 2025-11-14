import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { permissionKeys } from 'data/permissions/keys'
import type { ArrayElement, ResponseError } from 'types'
import { components } from '../vela/vela-schema'
import { organizationKeys } from './keys'

export type RoleType = components['schemas']['RoleCreate']['role_type']

export type RolePermission = ArrayElement<components['schemas']['RoleCreate']['access_rights']>

export type OrganizationRoleCreateVariables = {
  slug: string
  name: string
  roleType: RoleType
  permissions: RolePermission[]
  description?: string
}

export async function createOrganizationRole({
  slug,
  name,
  roleType,
  permissions,
  description,
}: OrganizationRoleCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/roles', {
    params: {
      path: {
        slug,
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

type OrganizationRoleCreateData = Awaited<ReturnType<typeof createOrganizationRole>>

export const useOrganizationRoleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<OrganizationRoleCreateData, ResponseError, OrganizationRoleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<OrganizationRoleCreateData, ResponseError, OrganizationRoleCreateVariables>(
    (vars) => createOrganizationRole(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(permissionKeys.list_permissions())
        await queryClient.invalidateQueries(permissionKeys.list_roles())
        await queryClient.invalidateQueries(organizationKeys.roles(variables.slug))

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create organization role: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
