import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // billing pages live under /billing/invoices and /billing/subscription, etc
  // so we need to pass the [5]th part of the url to the menu
  const page = router.pathname.includes('billing')
    ? router.pathname.split('/')[7]
    : router.pathname.split('/')[6]

  const menuRoutes = generateSettingsMenu(orgRef!, projectRef, branchRef, project)

  return (
    <ProjectLayout
      isBlocking={false}
      title={title || 'Settings'}
      product="Settings"
      productMenu={<ProductMenu page={page} menu={menuRoutes} />}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(SettingsLayout)
