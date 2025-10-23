import { useParams } from 'common'
import { Destinations } from 'components/interfaces/Database/Replication/Destinations'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { UnknownInterface } from 'components/ui/UnknownInterface'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const showPgReplicate = useIsFeatureEnabled('database:replication')

  if (!showPgReplicate) {
    return <UnknownInterface urlBack={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/schemas`} />
  }

  return (
    <>
      <PipelineRequestStatusProvider>
        <ScaffoldContainer>
          <ScaffoldSection>
            <div className="col-span-12">
              <FormHeader title="Replication" />
              <Destinations />
            </div>
          </ScaffoldSection>
        </ScaffoldContainer>
      </PipelineRequestStatusProvider>
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
