import { HooksListing } from 'components/interfaces/Auth/Hooks/HooksListing'
import AuthLayout from 'components/layouts/AuthLayout/AuthLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { DocsButton } from 'components/ui/DocsButton'

const Hooks: NextPageWithLayout = () => {
  // FIXME: need permission implemented   
  const canReadAuthSettings = true
  const isPermissionsLoaded = true

  if (isPermissionsLoaded && !canReadAuthSettings) {
    return <NoPermission isFullPage resourceText="access your project's auth hooks" />
  }

  return (
    <ScaffoldContainer>
      <HooksListing />
    </ScaffoldContainer>
  )
}
const secondaryActions = [
  <DocsButton key="docs" href="https://supabase.com/docs/guides/auth/auth-hooks" />,
]

Hooks.getLayout = (page) => (
  <DefaultLayout>
    <AuthLayout>
      <PageLayout
        title="Auth Hooks"
        subtitle="Use Postgres functions or HTTP endpoints to customize the behavior of Supabase Auth to meet your needs"
        secondaryActions={secondaryActions}
      >
        {page}
      </PageLayout>
    </AuthLayout>
  </DefaultLayout>
)

export default Hooks
