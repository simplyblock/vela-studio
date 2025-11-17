import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  return (
    <LogsPreviewer
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
      condensedLayout={true}
      tableName={LogsTableName.PGBOUNCER}
      queryType={'pgbouncer'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Dedicated Pooler Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
