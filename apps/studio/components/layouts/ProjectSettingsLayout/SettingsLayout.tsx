import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateSettingsMenu } from './SettingsMenu.utils'
import { useBranchProductPage } from 'hooks/misc/useBranchProductPage'

interface SettingsLayoutProps {
  title?: string
}

const SettingsLayout = ({ title, children }: PropsWithChildren<SettingsLayoutProps>) => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { page } = useBranchProductPage()

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
