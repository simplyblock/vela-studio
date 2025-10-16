import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from 'ui'

import { RoleLevelBadge } from './RoleLevelBadge'
import type { RoleDefinition } from './Role.types'

interface RolesTableProps {
  roles: RoleDefinition[]
  selectedRoleId: string | null
  onSelectRole: (roleId: string) => void
}

export const RolesTable = ({ roles, selectedRoleId, onSelectRole }: RolesTableProps) => {
  if (roles.length === 0) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-md border border-default bg-surface-100 text-sm text-foreground-lighter">
        No roles match your filters yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border border-default">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Role</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const isSelected = role.id === selectedRoleId

            return (
              <TableRow
                key={role.id}
                onClick={() => onSelectRole(role.id)}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-surface-200',
                  isSelected ? 'bg-surface-300/60 hover:bg-surface-300/60' : ''
                )}
              >
                <TableCell className="align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{role.name}</p>
                        <p className="text-xs text-foreground-lighter">{role.description}</p>
                      </div>
                      <RoleLevelBadge  level={role.level} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="align-top text-sm text-foreground-lighter">{role.type}</TableCell>
                <TableCell className="align-top text-right text-sm font-medium">{role.users}</TableCell>
                <TableCell className="align-top text-sm text-foreground-lighter capitalize">{role.status}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
