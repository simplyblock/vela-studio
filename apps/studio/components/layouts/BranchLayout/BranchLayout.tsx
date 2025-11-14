import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateBranchMenu } from './BranchLayout.utils'
import { useBranchProductPage } from 'hooks/misc/useBranchProductPage'

const BranchProductMenu = () => {
  const router = useRouter()
  const { slug, ref: projectRef = 'default' } = useParams() as { slug: string; ref?: string}
  const { page } = useBranchProductPage()

  return (
    <>
      <ProductMenu page={page} menu={generateBranchMenu(slug, projectRef)} />
    </>
  )
}

const BranchLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="Branching"
      product="Branching"
      productMenu={<BranchProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(BranchLayout)
