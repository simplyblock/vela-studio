import { Roles } from 'components/interfaces/Organization/TeamSettings/RBAC/Role/Roles'
import { UserSettings } from 'components/interfaces/Organization/TeamSettings/UserSettings'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'
import { getPathReferences } from 'data/vela/path-references'

const OrgTeamSettings: NextPageWithLayout = () => {
  const { slug } = getPathReferences()

  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { isLoading: isLoadingRoles } = useOrganizationRolesQuery({ slug });

  return selectedOrganization === undefined && isLoadingPermissions && isLoadingRoles ? <Loading /> : <Roles />
}

OrgTeamSettings.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgTeamSettings
