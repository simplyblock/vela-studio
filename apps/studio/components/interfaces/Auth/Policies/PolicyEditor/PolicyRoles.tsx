import { SYSTEM_ROLES } from 'components/interfaces/Database/Roles/Roles.constants'
import AlertError from 'components/ui/AlertError'

import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDatabaseRolesQuery } from 'data/database-roles/database-roles-query'
import { sortBy } from 'lodash'
import MultiSelect from 'ui-patterns/MultiSelectDeprecated'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface PolicyRolesProps {
  selectedRoles: string[]
  onUpdateSelectedRoles: (roles: string[]) => void
}
type SystemRole = (typeof SYSTEM_ROLES)[number]

const PolicyRoles = ({ selectedRoles, onUpdateSelectedRoles }: PolicyRolesProps) => {
  const { data: branch } = useSelectedBranchQuery()
  const { data, error, isLoading, isError, isSuccess } = useDatabaseRolesQuery({
    branch,
  })
  const roles = sortBy(
    (data ?? []).filter((role) => !SYSTEM_ROLES.includes(role.name as SystemRole)),
    (r) => r.name.toLocaleLowerCase()
  )

  const formattedRoles = roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      value: role.name,
      disabled: false,
    }
  })

  return (
    <div className="flex flex-col md:flew-row gap-4 md:gap-12">
      <div className="flex md:w-1/3 flex-col space-y-2">
        <label className="text-foreground-light text-base" htmlFor="policy-name">
          Target roles
        </label>
        <p className="text-foreground-lighter text-sm">Apply policy to the selected roles</p>
      </div>
      <div className="relative md:w-2/3">
        {isLoading && <ShimmeringLoader className="py-4" />}
        {isError && <AlertError error={error as any} subject="Failed to retrieve database roles" />}
        {isSuccess && (
          <MultiSelect
            options={formattedRoles}
            value={selectedRoles}
            placeholder="Defaults to all (public) roles if none selected"
            searchPlaceholder="Search for a role"
            onChange={onUpdateSelectedRoles}
          />
        )}
      </div>
    </div>
  )
}

export default PolicyRoles
