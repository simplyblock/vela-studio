import Metering from 'components/interfaces/Organization/Metering/Metering'
import DefaultLayout from 'components/layouts/DefaultLayout'
import OrganizationLayout from 'components/layouts/OrganizationLayout'
import OrganizationSettingsLayout from 'components/layouts/ProjectLayout/OrganizationSettingsLayout'
import { Loading } from 'components/ui/Loading'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import type { NextPageWithLayout } from 'types'

const OrgMetering: NextPageWithLayout = () => {
  const { isLoading: isLoadingPermissions } = usePermissionsQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  return selectedOrganization === undefined && isLoadingPermissions ? <Loading /> : <Metering />
}

OrgMetering.getLayout = (page) => (
  <DefaultLayout>
    <OrganizationLayout>
      <OrganizationSettingsLayout>{page}</OrganizationSettingsLayout>
    </OrganizationLayout>
  </DefaultLayout>
)

export default OrgMetering
