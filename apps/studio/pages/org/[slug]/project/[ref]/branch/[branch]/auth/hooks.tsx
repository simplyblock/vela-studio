import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'

const Hooks: NextPageWithLayout = () => {
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
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  }

  return (
    <ScaffoldContainer>
      <HooksListing />
    </ScaffoldContainer>
  )
}

Hooks.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Auth Hooks"
        subtitle="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs"
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default Hooks
