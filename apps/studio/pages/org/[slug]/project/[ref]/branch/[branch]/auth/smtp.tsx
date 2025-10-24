import { SmtpForm } from 'components/interfaces/Auth'
import { AuthEmailsLayout } from 'components/layouts/AuthLayout/AuthEmailsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'

const SmtpPage: NextPageWithLayout = () => {
  const { isLoading: isPermissionsLoading, can: canReadAuthSettings } =
    useCheckPermissions('branch:auth:read')

  if (isPermissionsLoading) {
    return (
      <div className="mt-12">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (!canReadAuthSettings) {
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
