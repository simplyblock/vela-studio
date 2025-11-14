import type { Member } from 'data/organizations/organization-members-query'
import type { ResourcePermission, Role } from 'types'


export const useGetRolesManagementPermissions = (
  orgSlug?: string,
  roles?: Role[],
  permissions?: ResourcePermission[]
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


export const hasMultipleOwners = (members: Member[] = [], roles: Role[] = []) => {
  // FIXME: @Chris needs permission check for organization owner
  const membersWhoAreOwners = members.filter((member) => {
    const [memberRoleId] = member.role_ids ?? []
    const role = roles.find((role: Role) => role.id === memberRoleId)
    return role?.name === 'Owner' && !member.email_verified
  })
  return membersWhoAreOwners.length > 1
}