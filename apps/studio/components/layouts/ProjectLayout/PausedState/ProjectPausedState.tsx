import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { ExternalLink, PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { PostgresEngine, ReleaseChannel } from 'data/projects/new-project.constants'
import { useProjectPauseStatusQuery } from 'data/projects/project-pause-status-query'
import { useProjectRestoreMutation } from 'data/projects/project-restore-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form_Shadcn_,
  Modal,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { RestorePaidPlanProjectNotice } from '../RestorePaidPlanProjectNotice'
import { PauseDisabledState } from './PauseDisabledState'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export interface ProjectPausedStateProps {
  product?: string
}

interface PostgresVersionDetails {
  postgresEngine: Exclude<PostgresEngine, '13' | '14'>
  releaseChannel: ReleaseChannel
}

export const extractPostgresVersionDetails = (value: string): PostgresVersionDetails => {
  const [postgresEngine, releaseChannel] = value.split('|')
  return { postgresEngine, releaseChannel } as PostgresVersionDetails
}

export const ProjectPausedState = ({ product }: ProjectPausedStateProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()

  const {
    data: pauseStatus,
    error: pauseStatusError,
    isError,
    isSuccess,
    isLoading,
  } = useProjectPauseStatusQuery({ ref: projectRef }, { enabled: project?.status === PROJECT_STATUS.INACTIVE })

  const finalDaysRemainingBeforeRestoreDisabled =
    pauseStatus?.remaining_days_till_restore_disabled ??
    pauseStatus?.max_days_till_restore_disabled ??
    0

  const isFreePlan = selectedOrganization?.plan?.id === 'free'
  const isRestoreDisabled = isSuccess && !pauseStatus.can_restore

  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug: orgRef },
    { enabled: isFreePlan }
  )

  const hasMembersExceedingFreeTierLimit = (membersExceededLimit || []).length > 0
  const [showConfirmRestore, setShowConfirmRestore] = useState(false)
  const [showFreeProjectLimitWarning, setShowFreeProjectLimitWarning] = useState(false)

  const { mutate: restoreProject, isLoading: isRestoring } = useProjectRestoreMutation({
    onSuccess: (_, variables) => {
      setProjectStatus(queryClient, orgRef!, variables.ref, PROJECT_STATUS.RESTORING)
      toast.success('Restoring project')
    },
  })

  const canResumeProject = useCheckPermissions("env:projects:pause")

  const onSelectRestore = () => {
    if (!canResumeProject) {
      toast.error('You do not have the required permissions to restore this project')
    } else if (hasMembersExceedingFreeTierLimit) setShowFreeProjectLimitWarning(true)
    else setShowConfirmRestore(true)
  }

  const onConfirmRestore = async (values: z.infer<typeof FormSchema>) => {
    if (!project) {
      return toast.error('Unable to restore: project is required')
    }

    restoreProject({ ref: project.ref })
  }

  const FormSchema = z.object({
    postgresVersionSelection: z.string(),
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: { postgresVersionSelection: '' },
  })

  return (
    <>
      <div className="space-y-4">
        <div className="w-full mx-auto mb-8 md:mb-16 max-w-7xl">
          <div className="flex md:h-[500px] items-center justify-center rounded border border-overlay bg-surface-100 p-4 md:p-8">
            <div className="grid w-[550px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <PauseCircle className="text-foreground-light" size={50} strokeWidth={1.5} />
              </div>

              <div className="flex flex-col gap-y-2">
                <div className="flex flex-col gap-y-1">
                  <p className="text-center">
                    The project "{project?.name ?? ''}" is currently paused.
                  </p>
                  <p className="text-sm text-foreground-light text-center">
                    All of your project's data is still intact, but your project is inaccessible
                    while paused.{' '}
                    {product !== undefined ? (
                      <>
                        Restore this project to access the{' '}
                        <span className="text-brand">{product}</span> page
                      </>
                    ) : (
                      'Restore this project and get back to building!'
                    )}
                  </p>
                </div>

                {isLoading && <GenericSkeletonLoader />}
                {isError && (
                  <AlertError error={pauseStatusError} subject="Failed to retrieve pause status" />
                )}
                {isSuccess && (
                  <>
                    {isRestoreDisabled ? (
                      <PauseDisabledState />
                    ) : isFreePlan ? (
                      <>
                        <Alert_Shadcn_>
                          <AlertTitle_Shadcn_>
                            Project can be restored through the dashboard within the next{' '}
                            {finalDaysRemainingBeforeRestoreDisabled} day
                            {finalDaysRemainingBeforeRestoreDisabled > 1 ? 's' : ''}
                          </AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_>
                            Free projects cannot be restored through the dashboard if they are
                            paused for more than{' '}
                            <span className="text-foreground">
                              {pauseStatus?.max_days_till_restore_disabled} days
                            </span>
                            . The latest that your project can be restored is by{' '}
                            <span className="text-foreground">
                              {dayjs()
                                .utc()
                                .add(pauseStatus.remaining_days_till_restore_disabled ?? 0, 'day')
                                .format('DD MMM YYYY')}
                            </span>
                            . However, your database backup and Storage objects will still be
                            available for download thereafter.
                          </AlertDescription_Shadcn_>
                          <AlertDescription_Shadcn_ className="mt-3">
                            <Button asChild type="default" icon={<ExternalLink />}>
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#time-limits"
                              >
                                More information
                              </a>
                            </Button>
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      </>
                    ) : (
                      <RestorePaidPlanProjectNotice />
                    )}
                  </>
                )}
              </div>

              {isSuccess && !isRestoreDisabled && (
                <div className="flex items-center justify-center gap-4">
                  <ButtonTooltip
                    size="tiny"
                    type="default"
                    disabled={!canResumeProject}
                    onClick={onSelectRestore}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canResumeProject
                          ? 'You need additional permissions to resume this project'
                          : undefined,
                      },
                    }}
                  >
                    Restore project
                  </ButtonTooltip>
                  {isFreePlan ? (
                    <Button asChild type="primary">
                      <Link
                        href={`/org/${orgRef}/billing?panel=subscriptionPlan&source=projectPausedStateRestore`}
                      >
                        Upgrade to Pro
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild type="default">
                      <Link href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`}>View project settings</Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        hideFooter
        visible={showConfirmRestore}
        size={'small'}
        title="Restore this project"
        description="Confirm to restore this project? Your project's data will be restored to when it was initially paused."
        onCancel={() => setShowConfirmRestore(false)}
        header={'Restore this project'}
      >
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onConfirmRestore)}>
            <Modal.Content className="flex items-center space-x-2 justify-end">
              <Button
                type="default"
                disabled={isRestoring}
                onClick={() => setShowConfirmRestore(false)}
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isRestoring}>
                Confirm restore
              </Button>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>

      <Modal
        hideFooter
        visible={showFreeProjectLimitWarning}
        size="medium"
        header="Your organization has members who have exceeded their free project limits"
        onCancel={() => setShowFreeProjectLimitWarning(false)}
      >
        <Modal.Content className="space-y-2">
          <p className="text-sm text-foreground-light">
            The following members have reached their maximum limits for the number of active free
            plan projects within organizations where they are an administrator or owner:
          </p>
          <ul className="pl-5 text-sm list-disc text-foreground-light">
            {(membersExceededLimit || []).map((member, idx: number) => (
              <li key={`member-${idx}`}>
                {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                projects)
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground-light">
            These members will need to either delete, pause, or upgrade one or more of these
            projects before you're able to unpause this project.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content>
          <Button
            htmlType="button"
            type="default"
            onClick={() => setShowFreeProjectLimitWarning(false)}
            block
          >
            Understood
          </Button>
        </Modal.Content>
      </Modal>
    </>
  )
}
