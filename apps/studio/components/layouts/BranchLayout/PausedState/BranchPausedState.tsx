import { zodResolver } from '@hookform/resolvers/zod'
import { PauseCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Button, Form_Shadcn_, Modal } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { PauseDisabledState } from './PauseDisabledState'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useBranchResumeMutation } from 'data/branches/branch-resume-mutation'

export const BranchPausedState = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const {
    data: branch,
    isLoading,
    isSuccess,
    isError,
    error: branchError,
  } = useSelectedBranchQuery()

  const canResumeBranch = useCheckPermissions('project:branches:stop')
  const isRestoreDisabled = isSuccess && !canResumeBranch.can

  const [showConfirmResume, setShowConfirmResume] = useState(false)

  const { mutate: resumeBranch, isLoading: isResuming } = useBranchResumeMutation({
    onSuccess: () => {
      toast.success('Branch resumed successfully')
      setShowConfirmResume(false)
    },
  })

  const onSelectResume = () => {
    if (!canResumeBranch)
      return toast.error('You do not have the required permissions to restore this branch')
    else if (!branch) {
      return toast.error('Unable to restore: branch is required')
    }
    resumeBranch({
      orgRef: branch.organization_id,
      projectRef: branch.project_id,
      branchRef: branch.id,
    })
  }

  const onConfirmRestore = async (values: z.infer<typeof FormSchema>) => {}

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
                    The project "{branch?.name ?? ''}" is currently paused.
                  </p>
                  <p className="text-sm text-foreground-light text-center">
                    All of your branch's data is still intact, but your branch is inaccessible while
                    paused.{' '}
                    {branch !== undefined ? (
                      <>
                        Restore this branch to access the{' '}
                        <span className="text-brand">{branch.name}</span> page
                      </>
                    ) : (
                      'Restore this branch and get back to building!'
                    )}
                  </p>
                </div>

                {isLoading && <GenericSkeletonLoader />}
                {isError && (
                  <AlertError error={branchError} subject="Failed to retrieve pause status" />
                )}
                {isSuccess && <PauseDisabledState />}
              </div>

              {isSuccess && !isRestoreDisabled && (
                <div className="flex items-center justify-center gap-4">
                  <ButtonTooltip
                    size="tiny"
                    type="default"
                    disabled={!canResumeBranch}
                    onClick={onSelectResume}
                    tooltip={{
                      content: {
                        side: 'bottom',
                        text: !canResumeBranch
                          ? 'You need additional permissions to resume this branch'
                          : undefined,
                      },
                    }}
                  >
                    Resume project
                  </ButtonTooltip>
                  <Button asChild type="default">
                    <Link
                      href={`/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`}
                    >
                      View project settings
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        hideFooter
        visible={showConfirmResume}
        size={'small'}
        title="Restore this branch"
        description="Confirm to restore this branch? Your branch's data will be restored to when it was initially paused."
        onCancel={() => setShowConfirmResume(false)}
        header={'Restore this branch'}
      >
        <Form_Shadcn_ {...form}>
          <form onSubmit={form.handleSubmit(onConfirmRestore)}>
            <Modal.Content className="flex items-center space-x-2 justify-end">
              <Button
                type="default"
                disabled={isResuming}
                onClick={() => setShowConfirmResume(false)}
              >
                Cancel
              </Button>
              <Button htmlType="submit" loading={isResuming}>
                Confirm restore
              </Button>
            </Modal.Content>
          </form>
        </Form_Shadcn_>
      </Modal>
    </>
  )
}
