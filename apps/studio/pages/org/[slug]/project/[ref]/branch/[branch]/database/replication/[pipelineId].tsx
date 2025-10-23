import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import { ReplicationPipelineStatus } from 'components/interfaces/Database/Replication/ReplicationPipelineStatus'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { PipelineRequestStatusProvider } from 'state/replication-pipeline-request-status'
import type { NextPageWithLayout } from 'types'

const DatabaseReplicationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()

  useEffect(() => {
    router.replace(`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/replication}`)
  }, [router, projectRef])

  return (
    <>
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
    </>
  )
}

DatabaseReplicationPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database Replication">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseReplicationPage
