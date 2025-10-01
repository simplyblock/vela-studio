import { useRouter } from 'next/router'
import { useContext, useEffect } from 'react'

import { FeatureFlagContext, useParams } from 'common'
import { ReplicationPipelineStatus } from 'components/interfaces/Database/Replication/ReplicationPipelineStatus'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useFlag } from 'hooks/ui/useFlag'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { hasLoaded } = useContext(FeatureFlagContext)
  const enablePgReplicate = useFlag('enablePgReplicate')

  useEffect(() => {
    if (hasLoaded && !enablePgReplicate) {
      router.replace(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/replication}`)
    }
  }, [router, hasLoaded, projectRef, enablePgReplicate])

  return (
    <>
      {enablePgReplicate && (
        <PipelineRequestStatusProvider>
          <ScaffoldContainer>
            <ScaffoldSection>
              <div className="col-span-12">
                <FormHeader title="Replication" />
                <ReplicationPipelineStatus />
              </div>
            </ScaffoldSection>
          </ScaffoldContainer>
        </PipelineRequestStatusProvider>
      )}
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
