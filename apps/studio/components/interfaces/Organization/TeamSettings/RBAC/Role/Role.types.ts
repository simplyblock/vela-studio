import type { RoleLevel } from './RoleLevelBadge'

export type RoleStatus = 'active' | 'disabled'

export interface RoleDefinition {
  id: string
  name: string
  description: string
  type: 'System' | 'Custom' | 'Derived'
  level: RoleLevel
  users: number
  status: RoleStatus
  permissions: string[]
  lastUpdated?: string
}
