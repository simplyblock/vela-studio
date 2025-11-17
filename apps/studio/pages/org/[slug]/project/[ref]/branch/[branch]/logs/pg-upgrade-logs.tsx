import { useParams } from 'common'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  return (
    <LogsPreviewer
      condensedLayout
      queryType="pg_upgrade"
      orgRef={orgRef!}
      projectRef={projectRef!}
      branchRef={branchRef!}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Database">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
