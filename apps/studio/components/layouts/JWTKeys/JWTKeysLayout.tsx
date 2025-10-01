import { PageLayout } from 'components/layouts/PageLayout/PageLayout'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { PropsWithChildren } from 'react'

import { useParams } from 'common'

const JWTKeysLayout = ({ children }: PropsWithChildren) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  const navigationItems = [
    {
      label: 'Legacy JWT Secret',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/jwt`,
      id: 'legacy-jwt-keys',
    },
    {
      label: 'JWT Signing Keys',
      href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/jwt/signing-keys`,
      id: 'signing-keys',
    },
  ]

  return (
    <PageLayout
      title="JWT Keys"
      subtitle="Control the keys used to sign JSON Web Tokens for your project"
      navigationItems={navigationItems}
    >
      <ScaffoldContainer className="flex flex-col py-8 gap-8" bottomPadding>
        {children}
      </ScaffoldContainer>
    </PageLayout>
  )
}

export default JWTKeysLayout
