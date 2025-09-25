import { ThirdPartyAuthForm } from 'components/interfaces/Auth'
import { AuthProvidersLayout } from 'components/layouts/AuthLayout/AuthProvidersLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'

const ThirdPartyPage: NextPageWithLayout = () => {
  // FIXME: need permission implemented   
  const canReadAuthSettings = true
  const isPermissionsLoaded = true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth provider settings" />
  }

  return (
    <ScaffoldContainer className="pb-16">
      <ThirdPartyAuthForm />
    </ScaffoldContainer>
  )
}

ThirdPartyPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthProvidersLayout>{page}</AuthProvidersLayout>
  </DefaultLayout>
)

export default ThirdPartyPage
