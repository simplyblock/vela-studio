import { ChevronRightIcon, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import DatabaseBackupsNav from 'components/interfaces/Database/Backups/DatabaseBackupsNav'
import { BackupsList } from 'components/interfaces/Database/Backups/RestoreToNewProject/BackupsList'
import { ConfirmRestoreDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/ConfirmRestoreDialog'
import { CreateNewProjectDialog } from 'components/interfaces/Database/Backups/RestoreToNewProject/CreateNewProjectDialog'
import { projectSpecToMonthlyPrice } from 'components/interfaces/Database/Backups/RestoreToNewProject/RestoreToNewProject.utils'
import { DiskType } from 'components/interfaces/DiskManagement/ui/DiskManagement.constants'
import { Markdown } from 'components/interfaces/Markdown'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { useCloneBackupsQuery } from 'data/projects/clone-query'
import { useCloneStatusQuery } from 'data/projects/clone-status-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { getDatabaseMajorVersion } from 'lib/helpers'
import type { NextPageWithLayout } from 'types'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Badge, Button } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { useParams } from 'common'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useBranchQuery } from 'data/branches/branch-query'

const RestoreToNewProjectPage: NextPageWithLayout = () => {
  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="rtnp" />
            <div className="space-y-8">
              <RestoreToNewProject />
            </div>
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

RestoreToNewProjectPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

const RestoreToNewProject = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useBranchQuery({orgRef, projectRef, branchRef})
  const { data: organization } = useSelectedOrganizationQuery()

  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const [selectedBackupId, setSelectedBackupId] = useState<number | null>(null)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [recoveryTimeTarget, setRecoveryTimeTarget] = useState<number | null>(null)

  const {
    data: cloneBackups,
    error,
    isLoading: cloneBackupsLoading,
    isError,
  } = useCloneBackupsQuery({ projectRef: project?.id })

  const isActiveHealthy = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY
  const { can: canReadPhysicalBackups, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:read")
  const { can: canTriggerPhysicalBackups } = useCheckPermissions("branch:settings:admin")
  const PITR_ENABLED = cloneBackups?.pitr_enabled
  const dbVersion = getDatabaseMajorVersion(branch?.database.version ?? '')
  const IS_PG15_OR_ABOVE = dbVersion >= 15
  const targetVolumeSizeGb = cloneBackups?.target_volume_size_gb
  const targetComputeSize = cloneBackups?.target_compute_size
  const planId = organization?.plan?.id ?? 'free'
  const { data } = useDiskAttributesQuery({ projectRef: project?.id })
  const storageType = data?.attributes?.type ?? 'gp3'

  const {
    data: cloneStatus,
    refetch: refetchCloneStatus,
    isLoading: cloneStatusLoading,
  } = useCloneStatusQuery(
    {
      projectRef: project?.id,
    },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        const hasTransientState = data?.clones?.some((c) => c.status === 'IN_PROGRESS') || false
        if (!hasTransientState) setRefetchInterval(false)
      },
      enabled: PITR_ENABLED,
    }
  )
  const IS_CLONED_PROJECT = (cloneStatus?.cloned_from?.source_project as any)?.ref ? true : false
  const isLoading = !isPermissionsLoaded || cloneBackupsLoading || cloneStatusLoading

  const previousClones = cloneStatus?.clones
  const isRestoring = previousClones?.some((c) => c.status === 'IN_PROGRESS')
  const restoringClone = previousClones?.find((c) => c.status === 'IN_PROGRESS')

  const StatusBadge = ({
    status,
  }: {
    status: NonNullable<typeof previousClones>[number]['status']
  }) => {
    const statusTextMap = {
      IN_PROGRESS: 'RESTORING',
      COMPLETED: 'COMPLETED',
      REMOVED: 'REMOVED',
      FAILED: 'FAILED',
    }

    if (status === 'IN_PROGRESS') {
      return <Badge variant="warning">{statusTextMap[status]}</Badge>
    }

    if (status === 'FAILED') {
      return <Badge variant="destructive">{statusTextMap[status]}</Badge>
    }

    return <Badge>{statusTextMap[status]}</Badge>
  }

  const PreviousRestoreItem = ({
    clone,
  }: {
    clone: NonNullable<typeof previousClones>[number]
  }) => {
    if (clone.status === 'REMOVED') {
      return (
        <div className="grid grid-cols-4 gap-2 text-sm p-4 group">
          <div className="min-w-24 truncate">{(clone.target_project as any).name}</div>
          <div>
            <StatusBadge status={clone.status} />
          </div>
          <div>
            <TimestampInfo
              className="font-mono text-xs text-foreground-lighter"
              utcTimestamp={clone.inserted_at ?? ''}
            />
          </div>
        </div>
      )
    } else {
      return (
        <Link
          href={`/org/${orgRef}/project/${clone.target_project.ref}`}
          className="grid grid-cols-4 gap-2 text-sm p-4 group"
        >
          <div className="min-w-24 truncate">{(clone.target_project as any).name}</div>
          <div>
            <StatusBadge status={clone.status} />
          </div>
          <div>
            <TimestampInfo
              className="font-mono text-xs text-foreground-lighter"
              utcTimestamp={clone.inserted_at ?? ''}
            />
          </div>
          <div className="flex items-center justify-end text-foreground-lighter group-hover:text-foreground">
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        </Link>
      )
    }
  }

  if (!canReadPhysicalBackups) {
    return <NoPermission resourceText="view backups" />
  }

  if (!canTriggerPhysicalBackups) {
    return <NoPermission resourceText="restore backups" />
  }

  if (!IS_PG15_OR_ABOVE) {
    return (
      <Admonition
        type="default"
        title="Restore to new project is not available for this database version"
      >
        <Markdown
          className="max-w-full"
          content={`Restore to new project is only available for Postgres 15 and above.  
            Go to [infrastructure settings](/org/${orgRef}/project/${project?.id}/branch/${branchRef}/settings/infrastructure)
            to upgrade your database version.
          `}
        />
      </Admonition>
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (IS_CLONED_PROJECT) {
    return (
      <Admonition type="default" title="This project cannot be restored to a new project">
        <Markdown
          className="max-w-full [&>p]:!leading-normal"
          content={`This is a temporary limitation whereby projects that were originally restored from another project cannot be restored to yet another project. 
          If you need to restore from a restored project, please reach out via [support](/support/new?projectRef=${project?.id}).`}
        />
        <Button asChild type="default">
          <Link href={`/org/${orgRef}/project/${(cloneStatus?.cloned_from?.source_project as any)?.ref || ''}`}>
            Go to original project
          </Link>
        </Button>
      </Admonition>
    )
  }

  if (isError) {
    return <AlertError error={error} subject="Failed to retrieve backups" />
  }

  if (!isActiveHealthy) {
    return (
      <Admonition
        type="default"
        title="Restore to new project is not available while project is offline"
        description="Your project needs to be online to restore your database to a new project"
      />
    )
  }

  if (
    !isLoading &&
    PITR_ENABLED &&
    !cloneBackups?.physicalBackupData.earliestPhysicalBackupDateUnix
  ) {
    return (
      <Admonition
        type="default"
        title="No backups found"
        description="PITR is enabled, but no backups were found. Check again in a few minutes."
      />
    )
  }

  if (!isLoading && !PITR_ENABLED && cloneBackups?.backups.length === 0) {
    return (
      <>
        <Admonition
          type="default"
          title="No backups found"
          description="Backups are enabled, but no backups were found. Check again tomorrow."
        />
      </>
    )
  }

  const additionalMonthlySpend = projectSpecToMonthlyPrice({
    targetVolumeSizeGb: targetVolumeSizeGb ?? 0,
    targetComputeSize: targetComputeSize ?? 'nano',
    planId: planId ?? 'free',
    storageType: storageType as DiskType,
  })

  return (
    <div className="flex flex-col gap-4">
      <ConfirmRestoreDialog
        open={showConfirmationDialog}
        onOpenChange={setShowConfirmationDialog}
        onSelectContinue={() => {
          setShowConfirmationDialog(false)
          setShowNewProjectDialog(true)
        }}
        additionalMonthlySpend={additionalMonthlySpend}
      />
      <CreateNewProjectDialog
        open={showNewProjectDialog}
        selectedBackupId={selectedBackupId}
        recoveryTimeTarget={recoveryTimeTarget}
        additionalMonthlySpend={additionalMonthlySpend}
        onOpenChange={setShowNewProjectDialog}
        onCloneSuccess={() => {
          refetchCloneStatus()
          setRefetchInterval(5000)
          setShowNewProjectDialog(false)
        }}
      />
      {isRestoring ? (
        <Alert_Shadcn_ className="[&>svg]:bg-none! [&>svg]:text-foreground-light mb-6">
          <Loader2 className="animate-spin" />
          <AlertTitle_Shadcn_>Restoration in progress</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              The new project {(restoringClone?.target_project as any)?.name || ''} is currently
              being created. You'll be able to restore again once the project is ready.
            </p>
            <Button asChild type="default" className="mt-2">
              <Link href={`/org/${orgRef}/project/${restoringClone?.target_project.ref}`}>Go to new project</Link>
            </Button>
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      ) : null}
      {previousClones?.length ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Previous restorations</h3>
          <Panel className="flex flex-col divide-y divide-border">
            {previousClones?.map((c) => <PreviousRestoreItem key={c.inserted_at} clone={c} />)}
          </Panel>
        </div>
      ) : null}
      <BackupsList
        disabled={isRestoring}
        onSelectRestore={(id) => {
          setSelectedBackupId(id)
          setShowConfirmationDialog(true)
        }}
      />
    </div>
  )
}

export default RestoreToNewProjectPage
