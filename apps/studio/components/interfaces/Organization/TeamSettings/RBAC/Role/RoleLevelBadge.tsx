import { Badge } from 'ui'

export type RoleLevel = 'organization' | 'environment' | 'project' | 'branch'

const ROLE_VARIANT_MAP: Record<RoleLevel, React.ComponentProps<typeof Badge>['variant']> =
  {
    organization: 'organization',
    environment: 'environment',
    project: 'project',
    branch: 'branch',
  }

interface RoleLevelBadgeProps {
  level: RoleLevel
}

export const RoleLevelBadge = ({ level }: RoleLevelBadgeProps) => {
  const label = level.charAt(0).toUpperCase() + level.slice(1)

  return (
    <Badge
      variant={ROLE_VARIANT_MAP[level]}
      className="tracking-wide text-[10px]"
    >
      {label}
    </Badge>
  )
}
