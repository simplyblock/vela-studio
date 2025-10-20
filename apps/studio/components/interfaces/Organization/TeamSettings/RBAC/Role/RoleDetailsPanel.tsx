import { Shield } from 'lucide-react'
import { Badge, Card, CardContent, CardDescription, CardHeader } from 'ui'

import { RoleLevelBadge } from './RoleLevelBadge'
import { OrganizationRole } from 'types'

interface RoleDetailsPanelProps {
  role?: OrganizationRole
}

export const RoleDetailsPanel = ({ role }: RoleDetailsPanelProps) => {
  if (!role) {
    return (
      <Card className="flex h-full min-h-[320px] items-center justify-center text-sm text-foreground-lighter">
        Select a role to preview its permissions.
      </Card>
    )
  }



  const statusVariant: 'success' | 'destructive' = role.is_active ? 'success' : 'destructive'
  const statusLabel = role.is_active ? 'Active' : 'Disabled'

  return (
    <Card className="h-full min-h-[320px]">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
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
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs uppercase">Type</span>
            <span className="text-foreground font-medium">{role.role_type}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs uppercase">Assigned users</span>
            <span className="text-foreground font-medium">{role.user_count}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs uppercase">Status</span>
            <Badge variant={statusVariant} className="w-min whitespace-nowrap">
              {statusLabel}
            </Badge>
          </div>
          {/*role.lastUpdated && (
            <div className="flex flex-col gap-1">
              <span className="text-foreground-muted text-xs uppercase">Last updated</span>
              <span className="text-foreground font-medium">{role.lastUpdated}</span>
            </div>
          ) */}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-foreground-muted text-xs uppercase">Key permissions</span>
          <ul className="list-disc space-y-1 pl-4 text-sm text-foreground">
            {(role.access_rights ?? []).map((permission) => (
              <li key={permission}>{permission}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
