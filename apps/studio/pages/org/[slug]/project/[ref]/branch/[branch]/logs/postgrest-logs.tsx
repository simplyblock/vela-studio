import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableEmptyState } from 'components/interfaces/Settings/Logs/LogsTableEmptyState'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="postgrest"
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
      tableName={LogsTableName.POSTGREST}
      EmptyState={
        <LogsTableEmptyState
          title="No results found"
          description="Only errors are captured into PostgREST logs by default. Check the API Gateway logs for HTTP requests."
        />
      }
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Postgrest Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
