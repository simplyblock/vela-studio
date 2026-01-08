import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn, ScrollArea } from 'ui'
import { Loader2 } from 'lucide-react'
import { RoleLevelBadge } from './RoleLevelBadge'
import { OrganizationRole } from 'types'
import UpdateRoleButton from './RoleUpdateButton'
import DeleteRoleButton from './RoleDeleteButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface RolesTableProps {
  roles: OrganizationRole[]
  selectedRoleId: string | null
  isRolesLoading: boolean
  onSelectRole: (roleId: string) => void
}

export const RolesTable = ({
  roles,
  isRolesLoading,
  selectedRoleId,
  onSelectRole,
}: RolesTableProps) => {
  const { can: canEditRole, isSuccess: isPermissionsSuccess } = useCheckPermissions("org:role:admin")
  return (
    <div className="rounded-md border border-default max-h-[520px] overflow-hidden bg-surface-100">
      <ScrollArea className="h-[520px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Role</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Users</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isRolesLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-foreground-lighter" />
                </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-foreground-lighter"
                >
                  No roles match your filters yet.
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => {
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
                          <RoleLevelBadge level={role.role_type} />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="align-top text-sm text-foreground-lighter">
                      {role.is_deletable ? 'Custom' : 'System'}
                    </TableCell>

                    <TableCell className="align-top text-right text-sm font-medium">
                      {role.user_count}
                    </TableCell>

                    <TableCell className="align-top text-sm text-foreground-lighter capitalize">
                      {role.is_active ? 'active' : 'inactive'}
                    </TableCell>

                    <TableCell className="align-top">
                      {isPermissionsSuccess && canEditRole && (
                      <div className="flex items-center justify-end gap-2">
                        <UpdateRoleButton role={role} />
                        {role.is_deletable && <DeleteRoleButton role={role} />}
                      </div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
