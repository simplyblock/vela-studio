import { useIsLoggedIn } from 'common'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  PermissionsData,
  PermissionsError,
  usePermissionsQuery,
} from 'data/permissions/permissions-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Permission, ResourcePermission, Role } from 'types'
import { getPathReferences } from 'data/vela/path-references'
import { UseQueryOptions } from '@tanstack/react-query'
import { useProjectsQuery } from '../../data/projects/projects-query'
import { useBranchesQuery } from '../../data/branches/branches-query'

function hasPermission(required: Permission, userPermissions: ResourcePermission[]): boolean {
  for (const userPermission of userPermissions) {
    // Organization admins have all permissions
    if (
      userPermission.permission.entity === 'org' &&
      userPermission.permission.resource === 'owner' &&
      userPermission.permission.action === 'admin'
    )
      return true

    if (userPermission.permission.entity !== required.entity) continue
    if (
      userPermission.permission.resource !== '*' &&
      userPermission.permission.resource !== required.resource
    )
      continue
    if (
      userPermission.permission.action !== '*' &&
      userPermission.permission.action !== required.action
    )
      continue
    return true
  }
  return false
}

export function transformToPermission(permission: string): Permission {
  const [entity, resource, action] = permission.split(':')
  return {
    entity: entity as any,
    resource,
    action,
  }
}

export function isOrganizationResourcePermission(permission: ResourcePermission): boolean {
  return typeof permission.organization_id === 'string'
}

export function isEnvironmentResourcePermission(permission: ResourcePermission): boolean {
  return typeof permission.env_type === 'string'
}

export function isProjectResourcePermission(permission: ResourcePermission): boolean {
  return typeof permission.project_id === 'string'
}

export function isBranchResourcePermission(permission: ResourcePermission): boolean {
  return typeof permission.branch_id === 'string'
}

export function isOrganizationPermission(permission: Permission): boolean {
  return permission.entity === 'org'
}

export function isEnvironmentPermission(permission: Permission): boolean {
  return permission.entity === 'env'
}

export function isProjectPermission(permission: Permission): boolean {
  return permission.entity === 'project'
}

export function isBranchPermission(permission: Permission): boolean {
  return permission.entity === 'branch'
}

export function isOrganizationRole(role: Role): boolean {
  return role.role_type === 'organization'
}

export function isEnvironmentRole(role: Role): boolean {
  return role.role_type === 'environment'
}

export function isProjectRole(role: Role): boolean {
  return role.role_type === 'project'
}

export function isBranchRole(role: Role): boolean {
  return role.role_type === 'branch'
}

export function usePermissionsLoaded() {
  const isLoggedIn = useIsLoggedIn()
  const { isFetched: isPermissionsFetched } = usePermissionsQuery({ enabled: isLoggedIn })
  const { isFetched: isOrganizationsFetched } = useOrganizationsQuery({ enabled: isLoggedIn })

  const { slug, ref } = getPathReferences()
  const { isFetched: isProjectDetailFetched } = useProjectDetailQuery(
    { slug, ref },
    { enabled: !!ref && isLoggedIn }
  )

  if (ref) {
    return isLoggedIn && isPermissionsFetched && isOrganizationsFetched && isProjectDetailFetched
  }

  return isLoggedIn && isPermissionsFetched && isOrganizationsFetched
}

function useFilteredPermissionsQuery(
  {
    filter,
  }: {
    filter?: (permission: ResourcePermission) => boolean
  },
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PermissionsData, PermissionsError, PermissionsData> = {}
) {
  const isLoggedIn = useIsLoggedIn()

  const {
    data: userPermissions,
    isLoading,
    isSuccess,
  } = usePermissionsQuery({ enabled: isLoggedIn && enabled, ...options })

  if (!isLoggedIn) {
    return {
      isLoading: true,
      isSuccess: false,
      permissions: [],
    }
  }

  const filteredPermissions = filter ? userPermissions?.filter(filter) : userPermissions
  return {
    isLoading,
    isSuccess,
    permissions: filteredPermissions || [],
  }
}

export function useOrganizationPermissionQuery({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, PermissionsData> = {}) {
  const { slug: orgId } = getPathReferences()

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isOrganizationResourcePermission(permission) && permission.organization_id === orgId,
    },
    {
      enabled: enabled && !!orgId,
      ...options,
    }
  )
  return { isLoading, isSuccess, permissions }
}

export function useEnvironmentPermissionQuery({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, PermissionsData> = {}) {
  const { slug: orgId } = getPathReferences()

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isEnvironmentResourcePermission(permission) && permission.organization_id === orgId,
    },
    {
      enabled: enabled && !!orgId,
      ...options,
    }
  )
  return { isLoading, isSuccess, permissions }
}

export function useProjectPermissionQuery({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, PermissionsData> = {}) {
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isSuccess: isProjectsSuccess,
  } = useProjectsQuery()

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isProjectResourcePermission(permission) &&
        (projects || []).some((project) => project.id === permission.project_id),
    },
    {
      enabled: enabled && !isProjectsLoading && isProjectsLoading,
      ...options,
    }
  )
  return {
    isLoading: isLoading || isProjectsLoading,
    isSuccess: isSuccess && isProjectsSuccess,
    permissions,
  }
}

export function useBranchPermissionQuery({
  enabled = true,
  ...options
}: UseQueryOptions<PermissionsData, PermissionsError, PermissionsData> = {}) {
  const { slug: orgId, ref: projectId } = getPathReferences()

  const {
    data: branches,
    isLoading: isBranchesLoading,
    isSuccess: isBranchesSuccess,
  } = useBranchesQuery({
    orgSlug: orgId,
    projectRef: projectId,
  })

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isBranchResourcePermission(permission) &&
        (branches || []).some((branch) => branch.id === permission.branch_id),
    },
    {
      enabled: enabled && !!orgId && !!projectId && !isBranchesLoading && isBranchesSuccess,
      ...options,
    }
  )
  return {
    isLoading: isLoading || isBranchesLoading,
    isSuccess: isSuccess && isBranchesSuccess,
    permissions,
  }
}

export function usePermissionsCheck(requiredPermission: Permission) {
  const { slug: orgId, ref: projectId, branch: branchId } = getPathReferences()

  const isLoggedIn = useIsLoggedIn()
  const {
    permissions: organizationPermissions,
    isLoading: isOrganizationPermissionsLoading,
    isSuccess: isOrganizationPermissionsSuccess,
  } = useOrganizationPermissionQuery()

  const {
    permissions: environmentPermissions,
    isLoading: isEnvironmentPermissionsLoading,
    isSuccess: isEnvironmentPermissionsSuccess,
  } = useProjectPermissionQuery()

  const {
    permissions: projectPermissions,
    isLoading: isProjectPermissionsLoading,
    isSuccess: isProjectPermissionsSuccess,
  } = useProjectPermissionQuery()

  const {
    permissions: branchPermissions,
    isLoading: isBranchPermissionsLoading,
    isSuccess: isBranchPermissionsSuccess,
  } = useProjectPermissionQuery()

  if (!isLoggedIn) {
    return {
      isLoading: true,
      isSuccess: false,
      can: false,
    }
  }

  const permissions = [
    ...organizationPermissions,
    ...(isEnvironmentPermission(requiredPermission) ? environmentPermissions : []),
    ...(isProjectPermission(requiredPermission) ? projectPermissions : []),
    ...(isBranchPermission(requiredPermission) ? branchPermissions : []),
  ]

  const can = hasPermission(requiredPermission, permissions)
  return {
    isLoading:
      isOrganizationPermissionsLoading ||
      isEnvironmentPermissionsLoading ||
      isProjectPermissionsLoading ||
      isBranchPermissionsLoading,
    isSuccess:
      isOrganizationPermissionsSuccess &&
      isEnvironmentPermissionsSuccess &&
      isProjectPermissionsSuccess &&
      isBranchPermissionsSuccess,
    can,
  }
}
