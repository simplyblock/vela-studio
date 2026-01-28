import { Permission } from 'types'
import { ProjectsData, useProjectsQuery } from '../projects/projects-query'
import { useMemo } from 'react'
import {
  hasPermission,
  isOrganizationResourcePermission,
  organizationOwnerPermission,
  permissionToString,
  transformToPermission,
  useIsOrganizationOwner,
  useOrganizationPermissionQuery,
} from 'hooks/misc/useCheckPermissions'

export function useProjectsByPermissionsQuery(permission: Permission | string): {
  data: ProjectsData
  isLoading: boolean
} {
  if (typeof permission === 'string') permission = transformToPermission(permission)

  const { data: allProjects, isLoading: isProjectsLoading } = useProjectsQuery()
  const { permissions, isLoading: isPermissionsLoading } = useOrganizationPermissionQuery()
  const { isOrganizationOwner, isLoading: isOrganizationOwnerLoading } = useIsOrganizationOwner()

  const isLoading = isProjectsLoading || isPermissionsLoading || isOrganizationOwnerLoading

  const projects = useMemo(() => {
    if (!permissions) return []

    const projectsWithPermission = permissions
      .filter(
        (userPermission) =>
          isOrganizationResourcePermission(userPermission) &&
          permissionToString(userPermission.permission) === permissionToString(permission)
      )
      .map((permission) => permission.project_id)

    return (allProjects ?? []).filter(
      (project) => isOrganizationOwner || projectsWithPermission.indexOf(project.id) !== -1
    )
  }, [permissions, allProjects])

  return { data: projects, isLoading }
}
