import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import NoPermission from 'components/ui/NoPermission'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const LogsPage: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  // FIXME: need permission implemented 
  const canReadAuthLogs = true
  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="access your project's authentication logs" />
  ) : !!project ? (
    <LogsPreviewer condensedLayout projectRef={project!.ref} queryType="auth" />
  ) : null
}

LogsPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Auth Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsPage
