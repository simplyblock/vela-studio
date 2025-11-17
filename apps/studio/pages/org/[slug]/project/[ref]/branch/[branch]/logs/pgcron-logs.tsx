import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import type { NextPageWithLayout } from 'types'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="pg_cron"
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
      tableName={LogsTableName.PG_CRON}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="PgCron Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
