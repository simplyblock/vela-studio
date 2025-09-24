import { PublicationsTables } from 'components/interfaces/Database/Publications/PublicationsTables'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'

const DatabasePublications: NextPageWithLayout = () => {
  // FIXME: need permission implemented   
  const { can: canViewPublications, isSuccess: isPermissionsLoaded } ={can:true,isSuccess:true}
  if (isPermissionsLoaded && !canViewPublications) {
    return <NoPermission isFullPage resourceText="view database publications" />
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection isFullWidth>
        <PublicationsTables />
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