import { useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { useParams } from 'common'

import {
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
} from 'components/layouts/Scaffold'
import { RolesTable } from '../Role/RolesTable'

import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { useOrganizationRoleAssignmentsQuery } from 'data/organization-members/organization-role-assignments-query'
import {
  type Member,
  useOrganizationMembersQuery,
} from 'data/organizations/organization-members-query'

import { useOrganizationMemberAssignRoleMutation } from 'data/organization-members/organization-member-role-assign-mutation'
import { useOrganizationMemberUnassignRoleMutation } from 'data/organization-members/organization-member-role-unassign-mutation'

import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

import {
  Button,
  Checkbox_Shadcn_,
  ScrollArea,
} from 'ui'
import { AssignMembersDialog } from './AssignMembersDialog'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

type RoleAssignmentsMap = Record<string, string[]> // roleId -> userIds[]

export const ProjectRoleAssignment = () => {
  const {can: canAssignRoles,isSuccess: isPermissionSuccess} = useCheckPermissions("project:role-assign:admin")

  const isReadOnly = isPermissionSuccess ? !canAssignRoles : true
  const { slug, ref } = useParams()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string[]>([])

  // scope
  const [selectedEnvTypes, setSelectedEnvTypes] = useState<string[]>([])
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])

  const { data: roles, isLoading: isLoadingRoles } = useOrganizationRolesQuery({ slug })
  const { data: roleAssignments, isLoading: isLoadingRoleAssignments } =
    useOrganizationRoleAssignmentsQuery({ slug })
  const { data: members, isLoading: isLoadingMembers } = useOrganizationMembersQuery({ slug })
  const { data: organization } = useSelectedOrganizationQuery()

  const { data: branches } = useBranchesQuery(
    { orgRef: slug, projectRef: ref! },
    { enabled: Boolean(ref) }
  )

  const { mutate: assignRole } = useOrganizationMemberAssignRoleMutation()
  const { mutate: unassignRole } = useOrganizationMemberUnassignRoleMutation()

  const isLoading = isLoadingRoles || isLoadingRoleAssignments || isLoadingMembers

  // Only project / env / branch roles
  const scopedRoles = useMemo(
    () => (roles || []).filter((r) => ['project', 'environment', 'branch'].includes(r.role_type)),
    [roles]
  )

  const roleAssignmentsMap: RoleAssignmentsMap = useMemo(() => {
    const map: RoleAssignmentsMap = {}
    ;(roleAssignments ?? []).forEach((link) => {
      if (!map[link.role_id]) map[link.role_id] = []
      if (!map[link.role_id].includes(link.user_id)) {
        map[link.role_id].push(link.user_id)
      }
    })
    return map
  }, [roleAssignments])

  const membersById = useMemo(() => {
    const map: Record<string, Member> = {}
    ;(members || []).forEach((m) => {
      if (m.user_id) map[m.user_id] = m
    })
    return map
  }, [members])

  const selectedRole = useMemo(
    () => scopedRoles.find((r) => r.id === selectedRoleId) ?? null,
    [scopedRoles, selectedRoleId]
  )

  const assignedMembers = useMemo(() => {
    if (!selectedRoleId) return []
    const userIds = roleAssignmentsMap[selectedRoleId] ?? []
    return userIds.map((id) => membersById[id]).filter((m): m is Member => !!m)
  }, [selectedRoleId, roleAssignmentsMap, membersById])

  const allMembers = members || []
  const orgEnvTypes = organization?.env_types ?? []

  const handleRemoveMember = (userId: string) => {
    if (!selectedRoleId || !slug) return
    unassignRole({ slug, userId, roleId: selectedRoleId })
  }

  const handleTogglePendingUser = (userId: string) => {
    setPendingSelection((p) =>
      p.includes(userId) ? p.filter((id) => id !== userId) : p.concat(userId)
    )
  }

  const handleToggleEnvType = (envType: string) => {
    setSelectedEnvTypes((p) =>
      p.includes(envType) ? p.filter((v) => v !== envType) : p.concat(envType)
    )
  }

  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds((p) =>
      p.includes(branchId) ? p.filter((id) => id !== branchId) : p.concat(branchId)
    )
  }

  const resetScope = () => {
    setSelectedEnvTypes([])
    setSelectedBranchIds([])
  }

  const handleSaveAssignments = () => {
    if (!selectedRoleId || !slug || !selectedRole) return

    const current = roleAssignmentsMap[selectedRoleId] ?? []
    const next = pendingSelection

    const toAdd = next.filter((id) => !current.includes(id))
    const toRemove = current.filter((id) => !next.includes(id))

    toAdd.forEach((userId) => {
      assignRole({
        slug,
        userId,
        roleId: selectedRoleId,
        projects: selectedRole.role_type === 'project' && ref ? [ref] : undefined,
        env_types: selectedRole.role_type === 'environment' ? selectedEnvTypes : undefined,
        branches: selectedRole.role_type === 'branch' ? selectedBranchIds : undefined,
      })
    })

    toRemove.forEach((userId) => {
      unassignRole({ slug, userId, roleId: selectedRoleId })
    })

    setIsAssignModalOpen(false)
  }

  const handleOpenAssignModal = () => {
    if (!selectedRoleId || !selectedRole) return
    if (isReadOnly) return
    const assigned = roleAssignmentsMap[selectedRoleId] ?? []
    setPendingSelection([...assigned])
    resetScope()
    setIsAssignModalOpen(true)
  }

  return (
    <>
      <ScaffoldFilterAndContent>
        <ScaffoldSectionContent className="w-full">
          {/* fixed height grid so the view doesn't grow indefinitely */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] h-[520px]">
            {/* Left: roles table, scrollable if many roles */}
            <div className="h-full rounded-md border border-default bg-surface-100">
              <ScrollArea className="h-full">
                <RolesTable
                  isRolesLoading={isLoading}
                  roles={scopedRoles}
                  selectedRoleId={selectedRoleId}
                  onSelectRole={setSelectedRoleId}
                />
              </ScrollArea>
            </div>

            {/* Right: assigned users, header fixed, list scrolls */}
            <div className="flex h-full flex-col rounded-md border border-default bg-surface-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedRole ? `Members with ${selectedRole.name}` : 'Select a role'}
                  </p>
                </div>

                {!isReadOnly && (
                  <Button
                  type="default"
                  size="small"
                  icon={<UserPlus size={14} />}
                  disabled={!selectedRole}
                  onClick={handleOpenAssignModal}
                >
                  Assign role
                </Button>
                )}
              </div>

              <ScrollArea className="mt-4 flex-1">
                {selectedRole ? (
                  assignedMembers.length > 0 ? (
                    <div className="flex flex-col gap-2 pb-2">
                      {assignedMembers.map((m) => (
                        <div
                          key={m.user_id}
                          className="flex items-center justify-between rounded border border-default bg-surface-200 px-3 py-2"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {m.username || m.primary_email || m.user_id}
                            </span>
                            {m.primary_email && (
                              <span className="text-xs text-foreground-light">
                                {m.primary_email}
                              </span>
                            )}
                          </div>

                          {!isReadOnly && (
                            <Button
                            type="text"
                            size="tiny"
                            className="px-1"
                            icon={<X size={14} />}
                            onClick={() => handleRemoveMember(m.user_id)}
                          />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center border border-dashed border-default rounded py-10 text-sm text-foreground-light">
                      No members assigned yet.
                    </div>
                  )
                ) : (
                  <div className="flex h-full items-center justify-center border border-dashed border-default rounded py-10 text-sm text-foreground-light">
                    Select a role to view assignments.
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>

      {/* Assignment modal */}
      <AssignMembersDialog
      open={isAssignModalOpen}
      onOpenChange={setIsAssignModalOpen}
      title={selectedRole ? `Assign ${selectedRole.name}` : 'Assign role'}
      members={allMembers}
      selectedIds={pendingSelection}
      onToggleMember={handleTogglePendingUser}
      isSaveDisabled={!selectedRole}
      onSave={handleSaveAssignments}
      scopeSlot={
        selectedRole && selectedRole.role_type !== 'project' ? (
          <div>
            <p className="mb-2 text-xs uppercase font-medium text-foreground-muted">Scope</p>

            {/* environment */}
            {selectedRole.role_type === 'environment' && (
              <ScrollArea className="max-h-[160px] pr-1">
                <div className="flex flex-col gap-1">
                  {orgEnvTypes.map((env) => {
                    const isChecked = selectedEnvTypes.includes(env)
                    return (
                      <div key={env} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox_Shadcn_
                          checked={isChecked}
                          onCheckedChange={() => handleToggleEnvType(env)}
                        />
                        <span className="text-sm">{env}</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}

            {/* branches */}
            {selectedRole.role_type === 'branch' && (
              <ScrollArea className="max-h-[160px] pr-1">
                <div className="flex flex-col gap-1">
                  {(branches || []).map((branch) => {
                    const isChecked = selectedBranchIds.includes(branch.id)
                    return (
                      <div key={branch.id} className="flex items-center gap-3 px-3 py-2">
                        <Checkbox_Shadcn_
                          checked={isChecked}
                          onCheckedChange={() => handleToggleBranch(branch.id)}
                        />
                        <span className="text-sm">{branch.name}</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : null
      }
    />
    </>
  )
}
