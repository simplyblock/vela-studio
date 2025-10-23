import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import ProjectLayout from 'components/layouts/ProjectLayout/ProjectLayout'
import { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  return (
    <DefaultLayout>
      <ProjectLayout>
        <UnifiedLogs />
      </ProjectLayout>
    </DefaultLayout>
  )

  return null
}

// Don't use getLayout since we're handling layouts conditionally within the component
LogPage.getLayout = (page) => page

export default LogPage
