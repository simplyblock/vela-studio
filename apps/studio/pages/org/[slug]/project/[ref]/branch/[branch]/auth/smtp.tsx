import { SmtpForm } from 'components/interfaces/Auth'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'

const SmtpPage: NextPageWithLayout = () => {
  // FIXME: need permission implemented   
  const canReadAuthSettings = true
  const isPermissionsLoaded = true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's email settings" />
  }

  return <SmtpForm />
}

SmtpPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthEmailsLayout>{page}</AuthEmailsLayout>
  </DefaultLayout>
)

export default SmtpPage
