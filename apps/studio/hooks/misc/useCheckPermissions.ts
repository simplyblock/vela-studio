import { useIsLoggedIn, useParams } from 'common'

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
import { useProjectsQuery } from 'data/projects/projects-query'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useMemo } from 'react'

export const organizationOwnerPermission = transformToPermission('org:owner:admin')

export function hasPermission(
  required: Permission,
  ...userPermissions: ResourcePermission[]
): boolean {
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

export function permissionToString(permission: Permission): string {
  return `${permission.entity}:${permission.resource}:${permission.action}`
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
    isError: isProjectsError,
  } = useProjectsQuery()

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isProjectResourcePermission(permission) &&
        (projects || []).some((project) => project.id === permission.project_id),
    },
    {
      enabled: enabled && !isProjectsLoading && isProjectsError,
      ...options,
    }
  )
  return {
    isLoading: isLoading || isProjectsLoading,
    isSuccess: isSuccess && !isProjectsError,
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
    isError: isBranchesError,
  } = useBranchesQuery(
    {
      orgRef: orgId,
      projectRef: projectId,
    },
    {
      enabled: enabled && !!orgId && !!projectId,
    }
  )

  const { permissions, isLoading, isSuccess } = useFilteredPermissionsQuery(
    {
      filter: (permission) =>
        isBranchResourcePermission(permission) &&
        (branches || []).some((branch) => branch.id === permission.branch_id),
    },
    {
      enabled: enabled && !!orgId && !!projectId && !isBranchesLoading && !isBranchesError,
      ...options,
    }
  )
  return {
    isLoading: isLoading || isBranchesLoading,
    isSuccess: isSuccess && !isBranchesError,
    permissions,
  }
}

export function useCheckPermissions(requiredPermission: string | undefined): {
  can: boolean
  isLoading: boolean
  isSuccess: boolean
}
export function useCheckPermissions(requiredPermission: undefined): {
  can: boolean
  isLoading: boolean
  isSuccess: boolean
}
export function useCheckPermissions(requiredPermission: string): {
  can: boolean
  isLoading: boolean
  isSuccess: boolean
}
export function useCheckPermissions(requiredPermission: Permission): {
  can: boolean
  isLoading: boolean
  isSuccess: boolean
}
export function useCheckPermissions(requiredPermission: Permission | string | undefined): {
  can: boolean
  isLoading: boolean
  isSuccess: boolean
} {
  const isLoggedIn = useIsLoggedIn()

  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const {
    permissions: organizationPermissions,
    isLoading: isOrganizationPermissionsLoading,
    isSuccess: isOrganizationPermissionsSuccess,
  } = useOrganizationPermissionQuery({
    enabled: !!orgId,
  })

  const {
    permissions: environmentPermissions,
    isLoading: isEnvironmentPermissionsLoading,
    isSuccess: isEnvironmentPermissionsSuccess,
  } = useEnvironmentPermissionQuery({
    enabled: !!orgId,
  })

  const {
    permissions: projectPermissions,
    isLoading: isProjectPermissionsLoading,
    isSuccess: isProjectPermissionsSuccess,
  } = useProjectPermissionQuery({
    enabled: !!orgId,
  })

  const {
    permissions: branchPermissions,
    isLoading: isBranchPermissionsLoading,
    isSuccess: isBranchPermissionsSuccess,
  } = useBranchPermissionQuery({
    enabled: !!orgId && !!projectId,
  })

  if (!isLoggedIn) {
    return {
      isLoading: true,
      isSuccess: false,
      can: false,
    }
  }

  if (typeof requiredPermission === 'undefined') {
    return {
      isLoading: false,
      isSuccess: false,
      can: true,
    }
  }

  if (typeof requiredPermission === 'string') {
    requiredPermission = transformToPermission(requiredPermission)
  }

  const permissions = [
    ...organizationPermissions,
    ...(isEnvironmentPermission(requiredPermission) ? environmentPermissions : []),
    ...(isProjectPermission(requiredPermission) ? projectPermissions : []),
    ...(isBranchPermission(requiredPermission) ? branchPermissions : []),
  ]

  const can = hasPermission(requiredPermission, ...permissions)
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

export function useIsOrganizationOwner() {
  const { permissions, isLoading } = useOrganizationPermissionQuery()

  const isOrganizationOwner = useMemo(
    () => hasPermission(organizationOwnerPermission, ...(permissions ?? [])),
    [permissions]
  )

  return {
    isLoading,
    isOrganizationOwner,
  }
}
