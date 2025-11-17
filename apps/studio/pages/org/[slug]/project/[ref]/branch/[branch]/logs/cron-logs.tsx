// select * from cron.job_run_details where jobid = '1' order by start_time desc limit 10

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
      tableName={LogsTableName.PG_CRON}
      queryType={'pg_cron'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Cron Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
