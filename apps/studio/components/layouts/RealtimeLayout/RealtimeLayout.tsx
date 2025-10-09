import { useRouter } from 'next/router'
import { PropsWithChildren } from 'react'

import { useIsRealtimeSettingsEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ProductMenu } from 'components/ui/ProductMenu'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { withAuth } from 'hooks/misc/withAuth'
import { useIsRealtimeSettingsFFEnabled } from 'hooks/ui/useFlag'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { generateRealtimeMenu } from './RealtimeMenu.utils'
import { useParams } from 'common'

export interface RealtimeLayoutProps {
  title: string
}

const RealtimeLayout = ({ title, children }: PropsWithChildren<RealtimeLayoutProps>) => {
  const { data: project } = useSelectedProjectQuery()
  const enableRealtimeSettingsFF = useIsRealtimeSettingsFFEnabled()
  const enableRealtimeSettingsFP = useIsRealtimeSettingsEnabled()
  const { slug: orgRef, branch: branchRef } = useParams() as { slug: string, branch: string }

  const enableRealtimeSettings = enableRealtimeSettingsFF && enableRealtimeSettingsFP

  const router = useRouter()
  const page = router.pathname.split('/')[6]

  return (
    <ProjectLayout
      title={title}
      product="Realtime"
      productMenu={
        <ProductMenu
          page={page}
          menu={generateRealtimeMenu(orgRef, project!, branchRef, { enableRealtimeSettings })}
        />
      }
    >
      {children}
    </ProjectLayout>
  )
}

export default withAuth(RealtimeLayout)
