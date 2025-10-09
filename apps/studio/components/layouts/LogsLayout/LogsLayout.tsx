
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  // FIXME: need permission implemented   
  const { isLoading, can: canUseLogsExplorer } = {can:true , isLoading:false}
  if (!canUseLogsExplorer) {
    if (isLoading) {
      return <ProjectLayout isLoading></ProjectLayout>
    }

    if (!isLoading && !canUseLogsExplorer) {
      return (
        <ProjectLayout>
          <NoPermission isFullPage resourceText="access your project's logs" />
        </ProjectLayout>
      )
    }
  }

  return (
    <ProjectLayout title={title} product="Logs & Analytics" productMenu={<LogsSidebarMenuV2 />}>
      {children}
    </ProjectLayout>
  )
}

export default withAuth(LogsLayout)
