import { useRouter } from 'next/router'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  return (
    <LogsPreviewer
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
      condensedLayout={true}
      tableName={LogsTableName.POSTGRES}
      queryType={'database'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Postgres Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
