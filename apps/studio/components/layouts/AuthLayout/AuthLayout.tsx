import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useAuthConfigPrefetch } from 'data/auth/auth-config-query'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAuthMenu } from './AuthLayout.utils'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

import { useBranchProductPage } from '../../../hooks/misc/useBranchProductPage'

const AuthProductMenu = () => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { page } = useBranchProductPage()

  useAuthConfigPrefetch({ projectRef })

  const { can: canViewPolicies } = useCheckPermissions("branch:rls:read")
  const { can: canAdminPolicies } = useCheckPermissions("branch:rls:admin")

  return <ProductMenu page={page} menu={generateAuthMenu(orgRef!, projectRef!, branchRef!, {
    showPolicies: canViewPolicies || canAdminPolicies,
  })} />
}

const AuthLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="Authentication"
      product="Authentication"
      productMenu={<AuthProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

/**
 * Layout for all auth pages on the dashboard, wrapped with withAuth to verify logged in state
 *
 * Handles rendering the navigation for each section under the auth pages.
 */
export default withAuth(AuthLayout)
