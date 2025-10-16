import { Search } from 'lucide-react'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import {
  ScaffoldActionsContainer,
  ScaffoldActionsGroup,
  ScaffoldContainer,
  ScaffoldFilterAndContent,
  ScaffoldSectionContent,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import { Button } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

import { RoleDetailsPanel } from './RoleDetailsPanel'
import { RolesTable } from './RolesTable'
import type { RoleDefinition } from './Role.types'

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

export const Roles = () => {
  const [searchString, setSearchString] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const filteredRoles = useMemo(() => {
    const normalized = searchString.trim().toLowerCase()
    if (!normalized) return DEFAULT_ROLES

    return DEFAULT_ROLES.filter((role) => {
      const haystack = `${role.name} ${role.description} ${role.type} ${role.status} ${role.level}`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchString])

  useEffect(() => {
    if (selectedRoleId && !filteredRoles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(null)
    }
  }, [filteredRoles, selectedRoleId])

  const selectedRole = useMemo(
    () => DEFAULT_ROLES.find((role) => role.id === selectedRoleId),
    [selectedRoleId]
  )

  return (
    <ScaffoldContainer>
      <ScaffoldTitle>Roles</ScaffoldTitle>
      <ScaffoldFilterAndContent>
        <ScaffoldActionsContainer className="w-full flex-col gap-2 justify-between md:flex-row">
          <Input
            size="tiny"
            autoComplete="off"
            icon={<Search size={12} />}
            value={searchString}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchString(event.target.value)}
            name="role-search"
            id="role-search"
            placeholder="Filter roles"
          />
          <ScaffoldActionsGroup className="w-full md:w-auto">
            <DocsButton href="https://supabase.com/docs/guides/platform/access-control" />
            <Button size="small">Create role</Button>
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>
        <ScaffoldSectionContent className="w-full">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RolesTable
              roles={filteredRoles}
              selectedRoleId={selectedRoleId}
              onSelectRole={setSelectedRoleId}
            />
            <RoleDetailsPanel role={selectedRole} />
          </div>
        </ScaffoldSectionContent>
      </ScaffoldFilterAndContent>
    </ScaffoldContainer>
  )
}
