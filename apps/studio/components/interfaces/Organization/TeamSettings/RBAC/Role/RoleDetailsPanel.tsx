import { Shield, Check } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'common'
import { Button, Card, CardContent, CardDescription, CardHeader, cn } from 'ui'

import { RoleLevelBadge } from './RoleLevelBadge'
import { OrganizationRole } from 'types'
import {
  useOrganizationRoleUpdateMutation,
  type RolePermission,
} from 'data/organizations/organization-role-update-mutation'
import { useAvailablePermissionsQuery } from 'data/permissions/available-permissions-query'

interface RoleDetailsPanelProps {
  role?: OrganizationRole
}

const formatPermissionLabel = (permission: string) => {
  const [scope, ...rest] = permission.split(':')

  const scopeMap: Record<string, string> = {
    org: 'Organization',
    env: 'Environment',
    project: 'Project',
    branch: 'Branch',
  }

  const capitalize = (value: string) =>
    value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value

  const prettyScope = scopeMap[scope] ?? capitalize(scope)
  const prettyRest = rest.map(capitalize)

  return [prettyScope, ...prettyRest].join(' ')
}

const formatRoleTypeLabel = (roleType: OrganizationRole['role_type']) => {
  const map: Record<OrganizationRole['role_type'], string> = {
    organization: 'Organization',
    environment: 'Environment',
    project: 'Project',
    branch: 'Branch',
  }
  return map[roleType] ?? roleType
}

export const RoleDetailsPanel = ({ role }: RoleDetailsPanelProps) => {
  if (!role) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center text-sm text-foreground-lighter">
        Select a role to preview its permissions.
      </Card>
    )
  }

  const { slug } = useParams()
  const { data: availablePermissions, isLoading: isPermissionsLoading } =
    useAvailablePermissionsQuery()

  const { mutate: updateRole, isLoading: isUpdating } = useOrganizationRoleUpdateMutation()

  const [selectedPermissions, setSelectedPermissions] = useState<RolePermission[]>(
    (role.access_rights ?? []) as RolePermission[]
  )

  useEffect(() => {
    setSelectedPermissions((role.access_rights ?? []) as RolePermission[])
  }, [role.id])

  // Map role_type -> permission prefix
  const prefixForRoleType: Record<OrganizationRole['role_type'], string> = {
    organization: 'org:',
    environment: 'env:',
    project: 'project:',
    branch: 'branch:',
  }

  const currentPrefix = prefixForRoleType[role.role_type]

  // Permissions scoped to this role type
  const roleScopedPermissions = useMemo(
    () =>
      ((availablePermissions ?? []) as RolePermission[]).filter((permission) =>
        currentPrefix ? permission.startsWith(currentPrefix) : false
      ),
    [availablePermissions, currentPrefix]
  )

  const handleTogglePermission = (permission: RolePermission, enabled: boolean) => {
    setSelectedPermissions((prev) => {
      if (enabled) return prev.includes(permission) ? prev : [...prev, permission]
      return prev.filter((p) => p !== permission)
    })
  }

  const handleSave = () => {
    if (!slug) return console.error('Slug is required')

    updateRole({
      slug,
      roleId: role.id,
      name: role.name,
      roleType: role.role_type,
      description: role.description ?? undefined,
      permissions: selectedPermissions,
    })
  }

  const permissionsTitle = `${formatRoleTypeLabel(role.role_type)} permissions`

  return (
    <Card className="flex h-full min-h-[320px] flex-col">
      <CardHeader className="gap-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-200 text-foreground">
              <Shield size={16} strokeWidth={1.5} />
            </span>
            <div className="flex flex-col">
              <p className="text-base font-medium text-foreground">{role.name}</p>
              <CardDescription>{role.description}</CardDescription>
            </div>
          </div>

          <RoleLevelBadge level={role.role_type} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <span className="text-foreground-muted text-xs uppercase">{permissionsTitle}</span>

          {isPermissionsLoading ? (
            <span className="text-xs text-foreground-lighter">Loading permissions...</span>
          ) : roleScopedPermissions.length === 0 ? (
            <span className="text-xs text-foreground-lighter">
              No {formatRoleTypeLabel(role.role_type).toLowerCase()}-level permissions available.
            </span>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto text-sm p-1">
              {roleScopedPermissions.map((permission) => {
                const checked = selectedPermissions.includes(permission)
                const label = formatPermissionLabel(permission)

                return (
                  <button
                    key={permission}
                    type="button"
                    onClick={() => handleTogglePermission(permission, !checked)}
                    className={cn(
                      'w-full rounded-md border px-3 py-2 text-left flex flex-col gap-1 transition-all',
                      checked
                        ? 'border-brand bg-brand-100 shadow-sm ring-1 ring-brand'
                        : 'border-border bg-surface-100 hover:bg-surface-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">{label}</span>
                      {checked && <Check className="h-4 w-4 text-brand" strokeWidth={2} />}
                    </div>
                    <span className="font-mono text-[11px] text-foreground-muted">
                      {permission}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-2 flex justify-end">
          <Button size="tiny" type="default" onClick={handleSave} loading={isUpdating}>
            Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
