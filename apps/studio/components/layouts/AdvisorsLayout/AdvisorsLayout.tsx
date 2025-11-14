import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateAdvisorsMenu } from './AdvisorsMenu.utils'
import { useParams } from 'common'
import { useBranchProductPage } from 'hooks/misc/useBranchProductPage'

export interface AdvisorsLayoutProps {
  title?: string
}

const AdvisorsLayout = ({ children }: PropsWithChildren<AdvisorsLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()

  const router = useRouter()
  const { slug: orgRef, branch: branchRef } = useParams() as { slug: string, branch?: string }
  const { page } = useBranchProductPage()

  return (
    <ProjectLayout
      isLoading={false}
      product="Advisors"
      productMenu={
        <ProductMenu page={page} menu={generateAdvisorsMenu(orgRef, project, branchRef)} />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(AdvisorsLayout)
