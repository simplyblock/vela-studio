import { Extensions } from 'components/interfaces/Database'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const DatabaseExtensions: NextPageWithLayout = () => {
  const { can: canReadExtensions, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:read")
  if (isPermissionsLoaded && !canReadExtensions) {
    return <NoPermission isFullPage resourceText="view database extensions" />
  }

  return (
    <PageLayout
      size="large"
      title="Database Extensions"
      subtitle="Manage what extensions are installed in your database"
    >
      <ScaffoldContainer size="large">
        <ScaffoldSection isFullWidth>
          <Extensions />
        </ScaffoldSection>
      </ScaffoldContainer>
    </PageLayout>
  )
}

DatabaseExtensions.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseExtensions
