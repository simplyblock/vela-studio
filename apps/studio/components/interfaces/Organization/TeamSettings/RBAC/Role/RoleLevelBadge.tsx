import { Badge } from 'ui'

export type RoleLevel = 'organization' | 'project'

interface RoleLevelBadgeProps {
  level: RoleLevel
}

export const RoleLevelBadge = ({ level }: RoleLevelBadgeProps) => {
  const label = level === 'organization' ? 'Organization' : 'Project'
  const variant = level === 'organization' ? 'brand' : 'default'

  return (
    <Badge variant={variant} className="tracking-wide text-[10px]">
      {label}
    </Badge>
  )
}
