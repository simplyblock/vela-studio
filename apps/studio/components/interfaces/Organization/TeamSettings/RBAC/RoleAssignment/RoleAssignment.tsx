import { useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'

import {
  ScaffoldContainer,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { RolesTable } from '../Role/RolesTable'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { getPathReferences } from 'data/vela/path-references'
import {
  Button,
  Checkbox_Shadcn_,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  ScrollArea,
} from 'ui'
import { useOrganizationRoleAssignmentsQuery } from 'data/organization-members/organization-role-assignments-query'
import { useOrganizationMemberAssignRoleMutation } from 'data/organization-members/organization-member-role-assign-mutation'
import { useOrganizationMemberUnassignRoleMutation } from 'data/organization-members/organization-member-role-unassign-mutation'
import { OrganizationMember, useOrganizationMembersQuery } from 'data/organizations/organization-members-query'

type RoleAssignmentsMap = Record<string, string[]> // roleId -> userIds[]

export const RoleAssignment = () => {
  const { slug } = getPathReferences()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string[]>([])

  const { data: roles, isLoading: isLoadingRoles } = useOrganizationRolesQuery({ slug })
  const { data: roleAssignments, isLoading: isLoadingRoleAssignments } =
    useOrganizationRoleAssignmentsQuery({ slug })
  const { data: members, isLoading: isLoadingMembers } = useOrganizationMembersQuery({ slug })

  const { mutate: assignRole } = useOrganizationMemberAssignRoleMutation()
  const { mutate: unassignRole } = useOrganizationMemberUnassignRoleMutation()

  const isLoading = isLoadingRoles || isLoadingRoleAssignments || isLoadingMembers

  // Only org-level roles
  const orgRoles = useMemo(
    () => (roles || []).filter((role) => role.role_type === 'organization'),
    [roles]
  )

  // Map roleId -> [userId, ...] for org-level assignments (no project/branch/env)
  const roleAssignmentsMap: RoleAssignmentsMap = useMemo(() => {
    const map: RoleAssignmentsMap = {}

    ;(roleAssignments?.links ?? []).forEach((link) => {
      if (link.project_id || link.branch_id || link.env_type) return
      if (!map[link.role_id]) map[link.role_id] = []
      if (!map[link.role_id].includes(link.user_id)) {
        map[link.role_id].push(link.user_id)
      }
    })

    return map
  }, [roleAssignments])

  const membersById = useMemo(() => {
    const map: Record<string, OrganizationMember> = {}
    ;(members || []).forEach((member) => {
      if (member.user_id) {
        map[member.user_id] = member
      }
    })
    return map
  }, [members])

  const selectedRole = useMemo(
    () => orgRoles.find((role) => role.id === selectedRoleId) ?? null,
    [orgRoles, selectedRoleId]
  )

  const assignedMembers = useMemo(() => {
    if (!selectedRoleId) return []
    const userIds = roleAssignmentsMap[selectedRoleId] ?? []
    return userIds
      .map((id) => membersById[id])
      .filter((m): m is OrganizationMember => Boolean(m))
  }, [selectedRoleId, roleAssignmentsMap, membersById])

  const allMembers = members || []

  const handleRemoveMember = (userId: string) => {
    if (!selectedRoleId || !slug) return

    // Fire unassign mutation (org-level: only userId + roleId)
    unassignRole({
      slug,
      userId,
      roleId: selectedRoleId,
    })
  }

  const handleTogglePendingUser = (userId: string) => {
    setPendingSelection((current) =>
      current.includes(userId) ? current.filter((id) => id !== userId) : current.concat(userId)
    )
  }

  const handleSaveAssignments = () => {
    if (!selectedRoleId || !slug) return

    const currentAssigned = roleAssignmentsMap[selectedRoleId] ?? []
    const nextAssigned = pendingSelection

    const toAdd = nextAssigned.filter((id) => !currentAssigned.includes(id))
    const toRemove = currentAssigned.filter((id) => !nextAssigned.includes(id))

    toAdd.forEach((userId) => {
      assignRole({
        slug,
        userId,
        roleId: selectedRoleId,
        // org-level: no projects / branches / env_types
      })
    })

    toRemove.forEach((userId) => {
      unassignRole({
        slug,
        userId,
        roleId: selectedRoleId,
      })
    })

    setIsAssignModalOpen(false)
  }

  const handleOpenAssignModal = () => {
    if (!selectedRoleId) return
    const currentlyAssigned = roleAssignmentsMap[selectedRoleId] ?? []
    setPendingSelection([...currentlyAssigned])
    setIsAssignModalOpen(true)
  }

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Role Assignment</ScaffoldTitle>

      <ScaffoldFilterAndContent>
        <ScaffoldSectionContent className="w-full">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RolesTable
              isRolesLoading={isLoading}
              roles={orgRoles}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
            />

            <div className="flex h-full flex-col gap-4 rounded-md border border-default bg-surface-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {selectedRole ? `Members with ${selectedRole.name}` : 'Select a role'}
                  </p>
                  <p className="text-xs text-foreground-light">
                    {selectedRole
                      ? 'Manage who inherits the permissions granted by this role.'
                      : 'Pick a role from the table to manage its assignments.'}
                  </p>
                </div>
                <Button
                  type="default"
                  size="small"
                  icon={<UserPlus size={14} />}
                  disabled={!selectedRole || isLoading}
                  onClick={handleOpenAssignModal}
                >
                  Add members
                </Button>
              </div>

              {selectedRole ? (
                assignedMembers.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {assignedMembers.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between rounded border border-default bg-surface-200 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">
                            {member.username || member.primary_email || member.user_id}
                          </span>
                          {member.primary_email && (
                            <span className="text-xs text-foreground-light">
                              {member.primary_email}
                            </span>
                          )}
                        </div>
                        <Button
                          type="text"
                          size="tiny"
                          className="px-1"
                          icon={<X size={14} />}
                          onClick={() => handleRemoveMember(member.user_id)}
                          aria-label={`Remove ${member.username || member.primary_email}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center rounded border border-dashed border-default py-12 text-center">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">No members assigned yet</p>
                      <p className="text-xs text-foreground-light">
                        Use the add members button to assign team members to this role.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-1 items-center justify-center rounded border border-dashed border-default py-12 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Select a role to continue</p>
                    <p className="text-xs text-foreground-light">
                      Choose a role from the table to view and edit its member assignments.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>

      <Dialog
        open={isAssignModalOpen}
        onOpenChange={(open) => {
          setIsAssignModalOpen(open)
          if (open && selectedRoleId) {
            const currentlyAssigned = roleAssignmentsMap[selectedRoleId] ?? []
            setPendingSelection([...currentlyAssigned])
          }
        }}
      >
        <DialogContent size="medium">
          <DialogHeader className="border-b">
            <DialogTitle>
              {selectedRole ? `Assign members to ${selectedRole.name}` : 'Assign members'}
            </DialogTitle>
          </DialogHeader>

          <DialogSection className="pt-4">
            <ScrollArea className="max-h-[320px] pr-1">
              <div className="flex flex-col gap-1">
                {allMembers.map((member) => {
                  const id = member.user_id
                  if (!id) return null
                  const isSelected = pendingSelection.includes(id)

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 transition hover:border-default hover:bg-surface-200"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox_Shadcn_
                          id={`assign-${id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleTogglePendingUser(id)}
                        />
                        <label htmlFor={`assign-${id}`} className="cursor-pointer select-none">
                          <p className="text-sm font-medium text-foreground">
                            {member.username || member.primary_email || id}
                          </p>
                          {member.primary_email && (
                            <p className="text-xs text-foreground-light">
                              {member.primary_email}
                            </p>
                          )}
                        </label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </DialogSection>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="default">Cancel</Button>
            </DialogClose>
            <Button
              type="primary"
              disabled={!selectedRole}
              onClick={handleSaveAssignments}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScaffoldContainer>
  )
}
