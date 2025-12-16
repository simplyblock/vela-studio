import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import { organizationKeys as organizationKeysV1 } from 'data/organizations/keys'
import type { ResponseError } from 'types'
import { organizationKeys } from './keys'

export type OrganizationMemberUnassignRoleVariables = {
  slug: string
  userId: string
  roleId: string
  skipInvalidation?: boolean
}

export async function unassignOrganizationMemberRole({
  slug,
  userId,
  roleId,
}: OrganizationMemberUnassignRoleVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/members/{user_id}/roles/{role_id}',
    {
      params: {
        path: {
          slug,
          user_id: userId,
          role_id: roleId,
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

type OrganizationMemberUnassignRoleData = Awaited<ReturnType<typeof unassignOrganizationMemberRole>>

export const useOrganizationMemberUnassignRoleMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<
    OrganizationMemberUnassignRoleData,
    ResponseError,
    OrganizationMemberUnassignRoleVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    OrganizationMemberUnassignRoleData,
    ResponseError,
    OrganizationMemberUnassignRoleVariables
  >((vars) => unassignOrganizationMemberRole(vars), {
    async onSuccess(data, variables, context) {
      const { slug, skipInvalidation } = variables

      if (!skipInvalidation) {
        await Promise.all([
          queryClient.invalidateQueries(organizationKeys.roles(slug)),
          queryClient.invalidateQueries(organizationKeysV1.members(slug)),
          queryClient.invalidateQueries(organizationKeys.role_assignments(slug)),
        ])
      }

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to unassign member role: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
