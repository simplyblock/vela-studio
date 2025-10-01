import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import { ProductMenu } from 'components/ui/ProductMenu'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'

const EdgeFunctionsProductMenu = () => {
  const { slug: orgRef, ref: projectRef = 'default', branch: branchRef } = useParams()
  const router = useRouter()
  const page = router.pathname.split('/')[6]

  const menuItems = [
    {
      title: 'Manage',
      items: [
        {
          name: 'Functions',
          key: 'main',
          pages: ['', '[functionSlug]', 'new'],
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/functions`,
          items: [],
        },
        {
          name: 'Secrets',
          key: 'secrets',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/functions/secrets`,
          items: [],
        },
      ],
    },
  ]

  return <ProductMenu page={page} menu={menuItems} />
}

const EdgeFunctionsLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <ProjectLayout
      title="Edge Functions"
      product="Edge Functions"
      productMenu={<EdgeFunctionsProductMenu />}
      isBlocking={false}
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(EdgeFunctionsLayout)
