import { useMemo, useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { useParams } from 'common'

import {
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { RolesTable } from '../Role/RolesTable'

import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import {
  useOrganizationRoleAssignmentsQuery,
  type RoleAssignmentsData,
} from 'data/organization-members/organization-role-assignments-query'
import { Member, useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationMemberAssignRoleMutation } from 'data/organization-members/organization-member-role-assign-mutation'
import { useOrganizationMemberUnassignRoleMutation } from 'data/organization-members/organization-member-role-unassign-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

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
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
} from 'ui'

type RoleAssignmentsMap = Record<string, string[]> // roleId -> userIds[]

// ----- MOCK DATA (toggle with USE_MOCK_DATA) -----

const USE_MOCK_DATA = true

const MOCK_ORGANIZATION = {
  id: 'org-1',
  env_types: ['development', 'staging', 'production'],
}

const MOCK_ROLES = [
  {
    id: 'role-project-maintainer',
    organization_id: 'org-1',
    name: 'Project Maintainer',
    description: 'Full access to project resources',
    role_type: 'project' as const,
    is_active: true,
    is_deletable: true,
    user_count: 2,
    access_rights: ['project:settings:read', 'project:settings:write'],
  },
  {
    id: 'role-env-operator',
    organization_id: 'org-1',
    name: 'Environment Operator',
    description: 'Manage environment-level settings',
    role_type: 'environment' as const,
    is_active: true,
    is_deletable: true,
    user_count: 1,
    access_rights: ['env:projects:read', 'env:projects:write'],
  },
  {
    id: 'role-branch-observer',
    organization_id: 'org-1',
    name: 'Branch Observer',
    description: 'Read-only access to selected branches',
    role_type: 'branch' as const,
    is_active: true,
    is_deletable: true,
    user_count: 1,
    access_rights: ['branch:logging:read'],
  },
]

const MOCK_MEMBERS: Member[] = [
  {
    user_id: 'user-1',
    username: 'alice',
    email: 'alice@example.com',
    primary_email: 'alice@example.com',
    is_sso_user: false,
    metadata: {},
    mfa_enabled: true,
    email_verified: true,
    active: true,
    last_activity_at: new Date().toISOString(),
    role_ids: [],
  },
  {
    user_id: 'user-2',
    username: 'bob',
    email: 'bob@example.com',
    primary_email: 'bob@example.com',
    is_sso_user: false,
    metadata: {},
    mfa_enabled: false,
    email_verified: true,
    active: true,
    last_activity_at: new Date().toISOString(),
    role_ids: [],
  },
  {
    user_id: 'user-3',
    username: 'carol',
    email: 'carol@example.com',
    primary_email: 'carol@example.com',
    is_sso_user: false,
    metadata: {},
    mfa_enabled: false,
    email_verified: false,
    active: true,
    last_activity_at: new Date().toISOString(),
    role_ids: [],
  },
]

const MOCK_PROJECTS = [
  {
    id: 'proj-1',
    name: 'Marketing Website',
    organization_id: 'org-1',
  },
  {
    id: 'proj-2',
    name: 'Analytics Service',
    organization_id: 'org-1',
  },
]

const MOCK_BRANCHES = [
  {
    id: 'branch-1',
    name: 'main',
    project_id: 'proj-1',
  },
  {
    id: 'branch-2',
    name: 'staging',
    project_id: 'proj-1',
  },
  {
    id: 'branch-3',
    name: 'main',
    project_id: 'proj-2',
  },
]

const MOCK_ROLE_ASSIGNMENTS: RoleAssignmentsData = {
  count: 4,
  links: [
    {
      organization_id: 'org-1',
      project_id: 'proj-1',
      branch_id: null,
      role_id: 'role-project-maintainer',
      user_id: 'user-1',
      env_type: null,
    },
    {
      organization_id: 'org-1',
      project_id: 'proj-2',
      branch_id: null,
      role_id: 'role-project-maintainer',
      user_id: 'user-2',
      env_type: null,
    },
    {
      organization_id: 'org-1',
      project_id: null,
      branch_id: null,
      role_id: 'role-env-operator',
      user_id: 'user-3',
      env_type: 'staging',
    },
    {
      organization_id: 'org-1',
      project_id: 'proj-1',
      branch_id: 'branch-2',
      role_id: 'role-branch-observer',
      user_id: 'user-2',
      env_type: null,
    },
  ],
}

// ----- COMPONENT -----

export const ProjectRoleAssignment = () => {
  const { slug } = useParams()

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string[]>([])

  // scope selections
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [selectedEnvTypes, setSelectedEnvTypes] = useState<string[]>([])
  const [selectedBranchProjectRef, setSelectedBranchProjectRef] = useState<string | null>(null)
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([])

  const { data: roles } = useOrganizationRolesQuery({ slug })
  const { data: roleAssignments } = useOrganizationRoleAssignmentsQuery({ slug })
  const { data: members } = useOrganizationMembersQuery({ slug })
  const { data: projects } = useProjectsQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: branches } = useBranchesQuery(
    { orgRef: slug, projectRef: selectedBranchProjectRef ?? '' },
    { enabled: Boolean(selectedBranchProjectRef) }
  )

  // Choose between real data and mocks
  const rolesData = useMemo(
    () => (USE_MOCK_DATA ? MOCK_ROLES : roles ?? []),
    [roles]
  )

  const roleAssignmentsData = useMemo(
    () => (USE_MOCK_DATA ? MOCK_ROLE_ASSIGNMENTS : roleAssignments),
    [roleAssignments]
  )

  const membersData = useMemo(
    () => (USE_MOCK_DATA ? MOCK_MEMBERS : members ?? []),
    [members]
  )

  const projectsData = useMemo(
    () => (USE_MOCK_DATA ? MOCK_PROJECTS : projects ?? []),
    [projects]
  )

  const organizationData = useMemo(
    () => (USE_MOCK_DATA ? MOCK_ORGANIZATION : organization),
    [organization]
  )

  const branchesData = useMemo(() => {
    if (USE_MOCK_DATA) {
      if (!selectedBranchProjectRef) return []
      return MOCK_BRANCHES.filter((b) => b.project_id === selectedBranchProjectRef)
    }
    return branches ?? []
  }, [branches, selectedBranchProjectRef])

  const { mutate: assignRole } = useOrganizationMemberAssignRoleMutation()
  const { mutate: unassignRole } = useOrganizationMemberUnassignRoleMutation()

  const isLoading = false // mocks always have data; if you want real loading, reintroduce flags

  // Only project / environment / branch roles
  const scopedRoles = useMemo(
    () =>
      (rolesData || []).filter((role) =>
        ['project', 'environment', 'branch'].includes(role.role_type)
      ),
    [rolesData]
  )

  // roleId -> [userId, ...] (any scoped assignment counts)
  const roleAssignmentsMap: RoleAssignmentsMap = useMemo(() => {
    const map: RoleAssignmentsMap = {}

    ;(roleAssignmentsData?.links ?? []).forEach((link) => {
      if (!map[link.role_id]) map[link.role_id] = []
      if (!map[link.role_id].includes(link.user_id)) {
        map[link.role_id].push(link.user_id)
      }
    })

    return map
  }, [roleAssignmentsData])

  const membersById = useMemo(() => {
    const map: Record<string, Member> = {}
    ;(membersData || []).forEach((member) => {
      if (member.user_id) {
        map[member.user_id] = member
      }
    })
    return map
  }, [membersData])

  const selectedRole = useMemo(
    () => scopedRoles.find((role) => role.id === selectedRoleId) ?? null,
    [scopedRoles, selectedRoleId]
  )

  const assignedMembers: Member[] = useMemo(() => {
    if (!selectedRoleId) return []

    const userIds = roleAssignmentsMap[selectedRoleId] ?? []

    return userIds
      .map((id) => membersById[id])
      .filter((m): m is Member => Boolean(m))
  }, [selectedRoleId, roleAssignmentsMap, membersById])

  const allMembers = membersData || []
  const orgEnvTypes = organizationData?.env_types ?? []
  const orgProjects = (projectsData || []).filter(
    (project) => project.organization_id === organizationData?.id
  )

  const handleRemoveMember = (userId: string) => {
    if (!selectedRoleId || !slug) return

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

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId) ? current.filter((id) => id !== projectId) : current.concat(projectId)
    )
  }

  const handleToggleEnvType = (envType: string) => {
    setSelectedEnvTypes((current) =>
      current.includes(envType) ? current.filter((v) => v !== envType) : current.concat(envType)
    )
  }

  const handleToggleBranch = (branchId: string) => {
    setSelectedBranchIds((current) =>
      current.includes(branchId) ? current.filter((id) => id !== branchId) : current.concat(branchId)
    )
  }

  const resetScopeSelectionForRole = (roleType: string) => {
    if (roleType === 'project') {
      setSelectedProjectIds([])
    } else if (roleType === 'environment') {
      setSelectedEnvTypes([])
    } else if (roleType === 'branch') {
      setSelectedBranchIds([])
      const firstProject = orgProjects[0]
      setSelectedBranchProjectRef(firstProject ? firstProject.id : null)
    }
  }

  const handleSaveAssignments = () => {
    if (!selectedRoleId || !slug || !selectedRole) return

    const currentAssigned = roleAssignmentsMap[selectedRoleId] ?? []
    const nextAssigned = pendingSelection

    const toAdd = nextAssigned.filter((id) => !currentAssigned.includes(id))
    const toRemove = currentAssigned.filter((id) => !nextAssigned.includes(id))

    toAdd.forEach((userId) => {
      assignRole({
        slug,
        userId,
        roleId: selectedRoleId,
        projects: selectedRole.role_type === 'project' ? selectedProjectIds : undefined,
        env_types: selectedRole.role_type === 'environment' ? selectedEnvTypes : undefined,
        branches: selectedRole.role_type === 'branch' ? selectedBranchIds : undefined,
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
    if (!selectedRoleId || !selectedRole) return

    const currentlyAssigned = roleAssignmentsMap[selectedRoleId] ?? []
    setPendingSelection([...currentlyAssigned])
    resetScopeSelectionForRole(selectedRole.role_type)
    setIsAssignModalOpen(true)
  }

  return (
    <>
      <ScaffoldTitle>Project-level Role Assignment</ScaffoldTitle>

      <ScaffoldFilterAndContent>
        <ScaffoldSectionContent className="w-full">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RolesTable
              isRolesLoading={isLoading}
              roles={scopedRoles}
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
                      ? 'Assign this role to members for specific projects, environments, or branches.'
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
                  Assign role
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
                        Use the Assign role button to assign this role to team members.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-1 items-center justify-center rounded border border-dashed border-default py-12 text-center">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Select a role to continue</p>
                    <p className="text-xs text-foreground-light">
                      Choose a project, environment, or branch role from the table to manage its
                      assignments.
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
          if (open && selectedRoleId && selectedRole) {
            const currentlyAssigned = roleAssignmentsMap[selectedRoleId] ?? []
            setPendingSelection([...currentlyAssigned])
            resetScopeSelectionForRole(selectedRole.role_type)
          }
        }}
      >
        <DialogContent size="medium">
          <DialogHeader className="border-b">
            <DialogTitle>
              {selectedRole ? `Assign ${selectedRole.name}` : 'Assign role'}
            </DialogTitle>
          </DialogHeader>

          <DialogSection className="flex flex-col gap-4 pt-4">
            {/* Members */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase text-foreground-muted">Members</p>
              <ScrollArea className="max-h-[220px] pr-1">
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
                            id={`assign-member-${id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleTogglePendingUser(id)}
                          />
                          <label
                            htmlFor={`assign-member-${id}`}
                            className="cursor-pointer select-none"
                          >
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
            </div>

            {/* Scope */}
            {selectedRole && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium uppercase text-foreground-muted">Scope</p>

                {selectedRole.role_type === 'project' && (
                  <ScrollArea className="max-h-[160px] pr-1">
                    <div className="flex flex-col gap-1">
                      {orgProjects.map((project) => {
                        const isChecked = selectedProjectIds.includes(project.id)
                        return (
                          <div
                            key={project.id}
                            className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 transition hover:border-default hover:bg-surface-200"
                          >
                            <Checkbox_Shadcn_
                              id={`project-${project.id}`}
                              checked={isChecked}
                              onCheckedChange={() => handleToggleProject(project.id)}
                            />
                            <label
                              htmlFor={`project-${project.id}`}
                              className="cursor-pointer select-none text-sm"
                            >
                              {project.name}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}

                {selectedRole.role_type === 'environment' && (
                  <ScrollArea className="max-h-[160px] pr-1">
                    <div className="flex flex-col gap-1">
                      {orgEnvTypes.map((env) => {
                        const isChecked = selectedEnvTypes.includes(env)
                        return (
                          <div
                            key={env}
                            className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 transition hover:border-default hover:bg-surface-200"
                          >
                            <Checkbox_Shadcn_
                              id={`env-${env}`}
                              checked={isChecked}
                              onCheckedChange={() => handleToggleEnvType(env)}
                            />
                            <label
                              htmlFor={`env-${env}`}
                              className="cursor-pointer select-none text-sm"
                            >
                              {env}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                )}

                {selectedRole.role_type === 'branch' && (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase text-foreground-muted">Project</span>
                      <Select_Shadcn_
                        value={selectedBranchProjectRef ?? ''}
                        onValueChange={(value) => {
                          setSelectedBranchProjectRef(value)
                          setSelectedBranchIds([])
                        }}
                      >
                        <SelectTrigger_Shadcn_ className="text-sm">
                          {orgProjects.find((p) => p.id === selectedBranchProjectRef)?.name ??
                            'Select a project'}
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectGroup_Shadcn_>
                            {orgProjects.map((project) => (
                              <SelectItem_Shadcn_ key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectGroup_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] uppercase text-foreground-muted">Branches</span>
                      <ScrollArea className="max-h-[160px] pr-1">
                        <div className="flex flex-col gap-1">
                          {branchesData.map((branch) => {
                            const isChecked = selectedBranchIds.includes(branch.id)
                            return (
                              <div
                                key={branch.id}
                                className="flex items-center gap-3 rounded-md border border-transparent px-3 py-2 transition hover:border-default hover:bg-surface-200"
                              >
                                <Checkbox_Shadcn_
                                  id={`branch-${branch.id}`}
                                  checked={isChecked}
                                  onCheckedChange={() => handleToggleBranch(branch.id)}
                                />
                                <label
                                  htmlFor={`branch-${branch.id}`}
                                  className="cursor-pointer select-none text-sm"
                                >
                                  {branch.name}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogSection>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="default">Cancel</Button>
            </DialogClose>
            <Button type="primary" disabled={!selectedRole} onClick={handleSaveAssignments}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
