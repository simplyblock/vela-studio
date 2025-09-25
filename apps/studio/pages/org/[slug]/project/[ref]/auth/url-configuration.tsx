import { RedirectUrls } from 'components/interfaces/Auth/RedirectUrls/RedirectUrls'
import SiteUrl from 'components/interfaces/Auth/SiteUrl/SiteUrl'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'

const URLConfiguration: NextPageWithLayout = () => {
  // FIXME: need permission implemented   
  const isPermissionsLoaded = true
  const canReadAuthSettings = true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? (
        <div className="mt-12">
          <GenericSkeletonLoader />
        </div>
      ) : (
        <>
          <SiteUrl />
          <RedirectUrls />
        </>
      )}
    </ScaffoldContainer>
  )
}

URLConfiguration.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="URL Configuration"
        subtitle="Configure site URL and redirect URLs for authentication"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default URLConfiguration
