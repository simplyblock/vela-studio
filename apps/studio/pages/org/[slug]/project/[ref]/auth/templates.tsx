import { EmailTemplates } from 'components/interfaces/Auth'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'

const TemplatesPage: NextPageWithLayout = () => {
  // FIXME: need permission implemented 
  const canReadAuthSettings = true
  const isPermissionsLoaded =true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return (
    <ScaffoldContainer>
      <EmailTemplates />
    </ScaffoldContainer>
  )
}

TemplatesPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default TemplatesPage
