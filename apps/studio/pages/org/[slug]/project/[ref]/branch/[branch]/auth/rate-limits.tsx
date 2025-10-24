import RateLimits from 'components/interfaces/Auth/RateLimits/RateLimits'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { DocsButton } from 'components/ui/DocsButton'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const RateLimitsPage: NextPageWithLayout = () => {
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
    return <NoPermission isFullPage resourceText="access your project's auth rate limit settings" />
  }

  return (
    <ScaffoldContainer>
      <RateLimits />
    </ScaffoldContainer>
  )
}

RateLimitsPage.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Rate Limits"
        subtitle="Safeguard against bursts of incoming traffic to prevent abuse and maximize stability"
        primaryActions={
          <DocsButton href="https://supabase.com/docs/guides/platform/going-into-prod#rate-limiting-resource-allocation--abuse-prevention" />
        }
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default RateLimitsPage
