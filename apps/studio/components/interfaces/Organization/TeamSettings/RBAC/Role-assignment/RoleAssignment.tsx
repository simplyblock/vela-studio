import { useMemo, useState } from 'react'
import { Building2, Layers, Shield, UserPlus, Users, X } from 'lucide-react'

import {
  ScaffoldContainer,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { StatsCard } from 'components/ui/StatsCard'
import { RolesTable } from '../Role/RolesTable'
import type { RoleDefinition } from '../Role/Role.types'
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

type User = {
  id: string
  name: string
  email: string
}

type RoleAssignments = Record<string, string[]>

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'org-admin',
    name: 'Organization admin',
    description: 'Full access to manage users, billing, and organization settings.',
    type: 'System',
    level: 'organization',
    users: 4,
    status: 'active',
    permissions: [
      'Manage organization membership',
      'Update billing and invoices',
      'Configure organization-wide settings',
    ],
    lastUpdated: 'Mar 18, 2024',
  },
  {
    id: 'org-analyst',
    name: 'Security analyst',
    description: 'Read-only visibility into projects and audit activity across the organization.',
    type: 'Custom',
    level: 'organization',
    users: 2,
    status: 'active',
    permissions: ['View organization audit log', 'Read project-level configuration'],
    lastUpdated: 'Feb 02, 2024',
  },
  {
    id: 'project-maintainer',
    name: 'Project maintainer',
    description: 'Manage schemas, secrets, and deployments for assigned projects.',
    type: 'Custom',
    level: 'project',
    users: 6,
    status: 'active',
    permissions: [
      'Manage database migrations',
      'Update project secrets',
      'Trigger project redeployments',
    ],
    lastUpdated: 'Apr 04, 2024',
  },
  {
    id: 'project-observer',
    name: 'Project observer',
    description: 'View metrics and logs on assigned projects without edit permissions.',
    type: 'Derived',
    level: 'project',
    users: 9,
    status: 'disabled',
    permissions: ['View project metrics', 'View project logs'],
    lastUpdated: 'Jan 27, 2024',
  },
]

const DEFAULT_USERS: User[] = [
  { id: 'u-1', name: 'Ana Martinez', email: 'ana.martinez@example.com' },
  { id: 'u-2', name: 'Caleb Ibrahim', email: 'caleb.ibrahim@example.com' },
  { id: 'u-3', name: 'Priya Desai', email: 'priya.desai@example.com' },
  { id: 'u-4', name: 'Jonas Becker', email: 'jonas.becker@example.com' },
  { id: 'u-5', name: 'Mei Chen', email: 'mei.chen@example.com' },
  { id: 'u-6', name: 'Thomas Osei', email: 'thomas.osei@example.com' },
  { id: 'u-7', name: 'Avery Collins', email: 'avery.collins@example.com' },
  { id: 'u-8', name: 'Sara Lee', email: 'sara.lee@example.com' },
  { id: 'u-9', name: 'Liam Gallagher', email: 'liam.gallagher@example.com' },
]

const DEFAULT_ASSIGNMENTS: RoleAssignments = {
  'org-admin': ['u-1', 'u-2', 'u-3', 'u-4'],
  'org-analyst': ['u-5', 'u-6'],
  'project-maintainer': ['u-2', 'u-3', 'u-5', 'u-7', 'u-8', 'u-9'],
  'project-observer': DEFAULT_USERS.map((user) => user.id),
}

const USERS_BY_ID = DEFAULT_USERS.reduce<Record<string, User>>((acc, user) => {
  acc[user.id] = user
  return acc
}, {})

export const RoleAssignment = () => {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(DEFAULT_ROLES[0]?.id ?? null)
  const [assignments, setAssignments] = useState<RoleAssignments>(DEFAULT_ASSIGNMENTS)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [pendingSelection, setPendingSelection] = useState<string[]>([])

  const rolesWithUsage = useMemo(
    () =>
      DEFAULT_ROLES.map((role) => ({
        ...role,
        users: assignments[role.id]?.length ?? 0,
      })),
    [assignments]
  )

  const stats = useMemo(
    () => [
      {
        title: 'Total roles',
        value: rolesWithUsage.length,
        description: 'Roles currently available to assign in this organization.',
        icon: <Shield size={18} />,
      },
      {
        title: 'Organization roles',
        value: rolesWithUsage.filter((role) => role.level === 'organization').length,
        description: 'Roles with organization-wide permissions.',
        icon: <Building2 size={18} />,
      },
      {
        title: 'Project roles',
        value: rolesWithUsage.filter((role) => role.level === 'project').length,
        description: 'Roles scoped to individual projects.',
        icon: <Layers size={18} />,
      },
      {
        title: 'Total users',
        value: DEFAULT_USERS.length,
        description: 'Users available for role assignments.',
        icon: <Users size={18} />,
      },
    ],
    [rolesWithUsage]
  )

  const selectedRole = useMemo(
    () => rolesWithUsage.find((role) => role.id === selectedRoleId) ?? null,
    [rolesWithUsage, selectedRoleId]
  )

  const assignedMembers = useMemo(() => {
    if (!selectedRoleId) return []
    const userIds = assignments[selectedRoleId] ?? []
    return userIds
      .map((id) => USERS_BY_ID[id])
      .filter((user): user is User => Boolean(user))
  }, [assignments, selectedRoleId])

  const handleRemoveMember = (userId: string) => {
    if (!selectedRoleId) return
    setAssignments((current) => {
      const members = current[selectedRoleId] ?? []
      return {
        ...current,
        [selectedRoleId]: members.filter((id) => id !== userId),
      }
    })

    if (isAssignModalOpen) {
      setPendingSelection((current) => current.filter((id) => id !== userId))
    }
  }

  const handleTogglePendingUser = (userId: string) => {
    setPendingSelection((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : current.concat(userId)
    )
  }

  const handleSaveAssignments = () => {
    if (!selectedRoleId) return
    setAssignments((current) => ({
      ...current,
      [selectedRoleId]: pendingSelection,
    }))
    setIsAssignModalOpen(false)
  }

  const handleOpenAssignModal = () => {
    if (!selectedRoleId) return
    setPendingSelection([...(assignments[selectedRoleId] ?? [])])
    setIsAssignModalOpen(true)
  }

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Role Assignment</ScaffoldTitle>

      <div className="mt-6 mb-2 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      <ScaffoldFilterAndContent>
        <ScaffoldSectionContent className="w-full">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RolesTable
              roles={rolesWithUsage}
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
                  disabled={!selectedRole}
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
                        key={member.id}
                        className="flex items-center justify-between rounded border border-default bg-surface-200 px-3 py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground">{member.name}</span>
                          <span className="text-xs text-foreground-light">{member.email}</span>
                        </div>
                        <Button
                          type="text"
                          size="tiny"
                          className="px-1"
                          icon={<X size={14} />}
                          onClick={() => handleRemoveMember(member.id)}
                          aria-label={`Remove ${member.name}`}
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
            setPendingSelection([...(assignments[selectedRoleId] ?? [])])
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
                {DEFAULT_USERS.map((user) => {
                  const isSelected = pendingSelection.includes(user.id)
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 transition hover:border-default hover:bg-surface-200"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox_Shadcn_
                          id={`assign-${user.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleTogglePendingUser(user.id)}
                        />
                        <label htmlFor={`assign-${user.id}`} className="cursor-pointer select-none">
                          <p className="text-sm font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-foreground-light">{user.email}</p>
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
            <Button type="primary" disabled={!selectedRole} onClick={handleSaveAssignments}>
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScaffoldContainer>
  )
}
