import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  const navItems = [
    {
      label: 'Supabase Auth',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`,
    },
    {
      label: 'Third Party Auth',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/third-party`,
    },
  ]

  return (
    <AuthLayout>
      <PageLayout
        title="Sign In / Providers"
        subtitle="Configure authentication providers and login methods for your users"
        navigationItems={navItems}
      >
        {children}
      </PageLayout>
    </AuthLayout>
  )
}
