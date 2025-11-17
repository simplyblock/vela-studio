import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
      tableName={LogsTableName.EDGE}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Edge Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
