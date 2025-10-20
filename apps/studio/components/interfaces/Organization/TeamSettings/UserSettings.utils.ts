import type { OrganizationMember } from 'data/organizations/organization-members-query'
import type { Permission, Role } from 'types'


export const useGetRolesManagementPermissions = (
  orgSlug?: string,
  roles?: Role[],
  permissions?: Permission[]
): { rolesAddable: string[]; rolesRemovable: string[] } => {

  const rolesAddable: string[] = []
  const rolesRemovable: string[] = []
  if (!roles || !orgSlug) return { rolesAddable, rolesRemovable }
  // FIXME: need permission implemented   
  /* roles.forEach((role: Role) => { 
    
    const canAdd = doPermissionsCheck(
      allPermissions,
      PermissionAction.CREATE,
      'auth.subject_roles',
      {
        resource: { role_id: role.role_id },
      },
      organizationSlug
    )
    if (canAdd) rolesAddable.push(role.role_id)

    const canRemove = doPermissionsCheck(
      allPermissions,
      PermissionAction.DELETE,
      'auth.subject_roles',
      {
        resource: { role_id: role.role_id },
      },
      organizationSlug
    )
    if (canRemove) rolesRemovable.push(role.role_id)
  })
*/
  return { rolesAddable, rolesRemovable }
}


export const hasMultipleOwners = (members: OrganizationMember[] = [], roles: Role[] = []) => {
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.role_id === memberRoleId)
    return role?.name === 'Owner' && !member.invited_at
  })
  return membersWhoAreOwners.length > 1
}