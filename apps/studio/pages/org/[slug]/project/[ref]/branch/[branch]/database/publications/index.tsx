import { PublicationsList } from 'components/interfaces/Database/Publications/PublicationsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const DatabasePublications: NextPageWithLayout = () => {
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:read")
  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        <PublicationsList />
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePublications.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">
      <PageLayout title="Database Publications">{page}</PageLayout>
    </DatabaseLayout>
  </DefaultLayout>
)

export default DatabasePublications