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
import { Input } from 'ui-patterns/DataInputs/Input'
import { RoleDetailsPanel } from './RoleDetailsPanel'
import { RolesTable } from './RolesTable'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import RoleCreateButton from './RoleCreateButton'
import { useParams } from 'common'

export const Roles = () => {
  const [searchString, setSearchString] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)

  const { slug } = useParams()
  const { data: roles, isLoading: isRolesLoading } = useOrganizationRolesQuery({ slug })

  const filteredRoles = useMemo(() => {
    const normalized = searchString.trim().toLowerCase()
    if (normalized.length === 0) return roles || []

    return (roles || []).filter((role) => {
      const haystack = `${role.name} ${role.role_type} ${
        role.is_active ? 'active' : 'inactive'
      }`.toLowerCase()
      return haystack.includes(normalized)
    })
  }, [searchString, roles])

  useEffect(() => {
    if (selectedRoleId && !filteredRoles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(null)
    }
  }, [filteredRoles, selectedRoleId])

  const selectedRole = useMemo(
    () => (roles || []).find((role) => role.id === selectedRoleId),
    [roles, selectedRoleId]
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
            <RoleCreateButton />
          </ScaffoldActionsGroup>
        </ScaffoldActionsContainer>

        <ScaffoldSectionContent className="w-full">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <RolesTable
              roles={filteredRoles}
              isRolesLoading={isRolesLoading}
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
