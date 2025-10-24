
import { PropsWithChildren } from 'react'

import NoPermission from 'components/ui/NoPermission'
import { withAuth } from 'hooks/misc/withAuth'
import ProjectLayout from '../ProjectLayout/ProjectLayout'
import { LogsSidebarMenuV2 } from './LogsSidebarMenuV2'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface LogsLayoutProps {
  title?: string
}

const LogsLayout = ({ title, children }: PropsWithChildren<LogsLayoutProps>) => {
  const { isLoading, can: canUseLogsExplorer } = useCheckPermissions("branch:logging:read")
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
