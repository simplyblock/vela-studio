import { AlertCircle } from 'lucide-react'
import { useParams } from 'common'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { PITRNotice, PITRSelection } from 'components/interfaces/Database/Backups/PITR'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBackupsQuery } from 'data/database/backups-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

const DatabasePhysicalBackups: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="pitr" />
            <div className="space-y-8">
              <PITR />
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

DatabasePhysicalBackups.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

const PITR = () => {
  const { slug: orgSlug, ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { error, isLoading, isError, isSuccess } = useBackupsQuery({ orgSlug, projectRef })

  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  // FIXME: need permission implemented 
  const { can: canReadPhysicalBackups, isSuccess: isPermissionsLoaded } ={can:true,isSuccess:true}

  if (isPermissionsLoaded && !canReadPhysicalBackups) {
    return <NoPermission resourceText="view PITR backups" />
  }

  return (
    <>
      {isLoading && <GenericSkeletonLoader />}
      {isError && <AlertError error={error} subject="Failed to retrieve PITR backups" />}
      {isSuccess && (
        <>
          {!isActiveHealthy ? (
            <Alert_Shadcn_>
              <AlertCircle />
              <AlertTitle_Shadcn_>
                Point in Time Recovery is not available while project is offline
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                Your project needs to be online to restore your database with Point in Time Recovery
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          ) : (
            <>
              <PITRNotice />
              <PITRSelection />
            </>
          )}
        </>
      )}
    </>
  )
}

export default DatabasePhysicalBackups
