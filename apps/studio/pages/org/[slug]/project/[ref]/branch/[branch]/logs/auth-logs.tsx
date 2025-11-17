import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import NoPermission from 'components/ui/NoPermission'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

const LogsPage: NextPageWithLayout = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const canReadAuthLogs = useCheckPermissions('branch:logging:read')

  return !canReadAuthLogs ? (
    <NoPermission isFullPage resourceText="access your project's authentication logs" />
  ) : !!project && !!branch ? (
    <LogsPreviewer
      condensedLayout
      orgRef={project.organization_id}
      projectRef={project.id}
      branchRef={branch.id}
      queryType="auth"
    />
  ) : null
}

LogsPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Auth Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogsPage
