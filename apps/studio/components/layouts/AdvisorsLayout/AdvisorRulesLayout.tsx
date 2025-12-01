import { PropsWithChildren } from 'react'

import { useParams } from 'common'
import DefaultLayout from '../DefaultLayout'
import { PageLayout } from '../PageLayout/PageLayout'
import AdvisorsLayout from './AdvisorsLayout'

export const AdvisorRulesLayout = ({ children }: PropsWithChildren<{}>) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  return (
    <DefaultLayout>
      <AdvisorsLayout>
        <PageLayout
          title="Advisor Settings"
          subtitle="Disable specific advisor categories or rules"
          navigationItems={[
            {
              label: 'Security',
              href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/rules/security`,
            },
            {
              label: 'Performance',
              href: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/rules/performance`,
            },
          ]}
        >
          {children}
        </PageLayout>
      </AdvisorsLayout>
    </DefaultLayout>
  )
}
