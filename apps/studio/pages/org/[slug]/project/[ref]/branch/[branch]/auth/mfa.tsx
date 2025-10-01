
import { MfaAuthSettingsForm } from 'components/interfaces/Auth'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'

const MfaPage: NextPageWithLayout = () => {
  // FIXME: need permission implemented 
  const isPermissionsLoaded = true
  const canReadAuthSettings = true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's authentication settings" />
  }

  return (
    <ScaffoldContainer>
      {!isPermissionsLoaded ? <GenericSkeletonLoader /> : <MfaAuthSettingsForm />}
    </ScaffoldContainer>
  )
}

MfaPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Multi-Factor Authentication (MFA)"
        subtitle="Requires users to provide additional verification factors to authenticate"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default MfaPage
