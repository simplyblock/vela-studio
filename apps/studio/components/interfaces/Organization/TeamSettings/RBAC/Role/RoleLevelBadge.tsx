import { Badge } from 'ui'

export type RoleLevel = "organization" | "environment" | "project" | "branch"

interface RoleLevelBadgeProps {
  level: RoleLevel
}

export const RoleLevelBadge = ({ level }: RoleLevelBadgeProps) => {
  const label = level.charAt(0).toUpperCase() + level.slice(1)
  const variant = level === 'organization' ? 'brand' : 'default'

  return (
    <Badge variant={variant} className="tracking-wide text-[10px]">
      {label}
    </Badge>
  )
}
