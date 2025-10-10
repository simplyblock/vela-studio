import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import AuthLayout from './AuthLayout'

export const AuthProvidersLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  const navItems = [
    {
      label: 'User Signup',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/signup`,
    },
    {
      label: 'Auth Providers',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`,
    },
  ]

  return (
    <AuthLayout>
      <PageLayout
        title="Sign Up / Providers"
        subtitle="Configure authentication providers and login methods for your users"
        navigationItems={navItems}
      >
        {children}
      </PageLayout>
    </AuthLayout>
  )
}
