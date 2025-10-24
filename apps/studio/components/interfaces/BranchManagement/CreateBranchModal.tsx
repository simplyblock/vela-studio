import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { DatabaseZap, DollarSign } from 'lucide-react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { InlineLink, InlineLinkClassName } from 'components/ui/InlineLink'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useDiskAttributesQuery } from 'data/config/disk-attributes-query'
import { projectKeys } from 'data/projects/keys'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_ as Label,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const CreateBranchModal = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: selectedOrg } = useSelectedOrganizationQuery()
  const { showCreateBranchModal, setShowCreateBranchModal } = useAppStateSnapshot()

  const { can: canCreateBranch } = useCheckPermissions("project:branches:create")

  const formId = 'create-branch-form'
  const FormSchema = z
    .object({
      branchName: z
        .string()
        .min(1, 'Branch name cannot be empty')
        .refine(
          (val) => /^[a-zA-Z0-9\-_]+$/.test(val),
          'Branch name can only contain alphanumeric characters, hyphens, and underscores.'
        )
        .refine(
          (val) => (branches ?? []).every((branch) => branch.name !== val),
          'A branch with this name already exists'
        ),
      withData: z.boolean().default(false).optional(),
    })

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues: { branchName: '', withData: false },
  })
  const withData = form.watch('withData')

  const { data: branches } = useBranchesQuery({ projectRef })
  const mainBranch = branches?.find(branch => branch.name === 'main')

  const {
    data: disk,
    isLoading: isLoadingDiskAttr,
    isError: isErrorDiskAttr,
  } = useDiskAttributesQuery({ projectRef }, { enabled: showCreateBranchModal && withData })
  const projectDiskAttributes = disk?.attributes ?? {
    type: 'gp3',
    size_gb: 0,
    iops: 0,
    throughput_mbps: 0,
  }
  // Branch disk is oversized to include backup files, it should be scaled back eventually.
  const branchDiskAttributes = {
    ...projectDiskAttributes,
    // [Joshen] JFYI for Qiao - this multiplier may eventually be dropped
    size_gb: Math.round(projectDiskAttributes.size_gb * 1.5),
  }
  const branchComputeSize = { label: 'small', priceHourly: 0 }
  const estimatedDiskCost = { size: 0, iops: 0, throughput: 0, total: 0 }

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: createBranch, isLoading: isCreatingBranch } = useBranchCreateMutation({
    onSuccess: async (data) => {
      toast.success(`Successfully created preview branch "${data.name}"`)
      if (projectRef) {
        await Promise.all([queryClient.invalidateQueries(projectKeys.detail(orgRef, projectRef))])
      }
      sendEvent({
        action: 'branch_create_button_clicked',
        properties: {
          branchType: 'persistent',
        },
        groups: {
          project: projectRef ?? 'Unknown',
          organization: selectedOrg?.slug ?? 'Unknown',
        },
      })

      setShowCreateBranchModal(false)
      router.push(`/org/${orgRef}/project/${data.project_id}/branch/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create branch: ${error.message}`)
    },
  })

  const isDisabled =
    !canCreateBranch ||
    isCreatingBranch

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    if (!projectRef) return console.error('Project ref is required')
    if (!mainBranch) return console.error('Main branch ref is required')
    createBranch({
      orgRef: orgRef!,
      projectRef,
      branchRef: branchRef ?? mainBranch.id,
      branchName: data.branchName,
      ...(data.withData ? { desired_instance_size: 0 } : {}),
    })
  }

  useEffect(() => {
    if (form && showCreateBranchModal) {
      form.reset()
    }
  }, [form, showCreateBranchModal])

  return (
    <Dialog open={showCreateBranchModal} onOpenChange={(open) => setShowCreateBranchModal(open)}>
      <DialogContent
        size="large"
        hideClose
        aria-describedby={undefined}
      >
        <DialogHeader padding="small">
          <DialogTitle>Create a new preview branch</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />

        <Form_Shadcn_ {...form}>
          <form id={formId} onSubmit={form.handleSubmit(onSubmit)}>
            <DialogSection
              padding="medium"
              className={cn('space-y-4')}
            >
              <FormField_Shadcn_
                control={form.control}
                name="branchName"
                render={({ field }) => (
                  <FormItemLayout label="Preview Branch Name">
                    <FormControl_Shadcn_>
                      <Input_Shadcn_
                        {...field}
                        placeholder="e.g. staging, dev-feature-x"
                        autoComplete="off"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <FormField_Shadcn_
                control={form.control}
                name="withData"
                render={({ field }) => (
                  <FormItemLayout
                    label={
                      <>
                        <Label className="mr-2">Include data</Label>
                      </>
                    }
                    layout="flex-row-reverse"
                    className="[&>div>label]:mb-1"
                    description="Clone production data into this branch"
                  >
                    <FormControl_Shadcn_>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </DialogSection>

            <DialogSectionSeparator />

            <DialogSection
              padding="medium"
              className={cn('flex flex-col gap-4')}
            >
              {withData && (
                <div className="flex flex-row gap-4">
                  <div>
                    <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                      <DatabaseZap className="text-info" size={20} strokeWidth={2} />
                    </figure>
                  </div>
                  <div className="flex flex-col gap-y-1">
                    {isLoadingDiskAttr ? (
                      <>
                        <ShimmeringLoader className="w-32 h-5 py-0" />
                        <ShimmeringLoader className="w-72 h-8 py-0" />
                      </>
                    ) : (
                      <>
                        {isErrorDiskAttr ? (
                          <>
                            <p className="text-sm text-foreground">
                              Branch disk size will incur additional cost per month
                            </p>
                            <p className="text-sm text-foreground-light">
                              The additional cost and time taken to create a data branch is relative
                              to the size of your database. We are unable to provide an estimate as
                              we were unable to retrieve your project's disk configuration
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-foreground">
                              Branch disk size is billed at ${estimatedDiskCost.total.toFixed(2)}{' '}
                              per month
                            </p>
                            <p className="text-sm text-foreground-light">
                              Creating a data branch will take about{' '}
                              <span className="text-foreground">
                                {0 /* FIXME: add computation */} minutes
                              </span>{' '}
                              and costs{' '}
                              <span className="text-foreground">
                                ${estimatedDiskCost.total.toFixed(2)}
                              </span>{' '}
                              per month based on your current target database volume size of{' '}
                              {branchDiskAttributes.size_gb} GB and your{' '}
                              <Tooltip>
                                <TooltipTrigger>
                                  <span className={InlineLinkClassName}>
                                    project's disk configuration
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">Disk type:</p>
                                    <p className="w-16">
                                      {branchDiskAttributes.type.toUpperCase()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">Targer disk size:</p>
                                    <p className="w-16">{branchDiskAttributes.size_gb} GB</p>
                                    <p>(${estimatedDiskCost.size.toFixed(2)})</p>
                                  </div>
                                  <div className="flex items-center gap-x-2">
                                    <p className="w-24">IOPs:</p>
                                    <p className="w-16">{branchDiskAttributes.iops} IOPS</p>
                                    <p>(${estimatedDiskCost.iops.toFixed(2)})</p>
                                  </div>
                                  {'throughput_mbps' in branchDiskAttributes && (
                                    <div className="flex items-center gap-x-2">
                                      <p className="w-24">Throughput:</p>
                                      <p className="w-16">
                                        {branchDiskAttributes.throughput_mbps} MB/s
                                      </p>
                                      <p>(${estimatedDiskCost.throughput.toFixed(2)})</p>
                                    </div>
                                  )}
                                  <p className="mt-2">
                                    More info in{' '}
                                    <InlineLink
                                      onClick={() => setShowCreateBranchModal(false)}
                                      className="pointer-events-auto"
                                      href={`/org/${orgRef}/project/${projectRef}/settings/compute-and-disk`}
                                    >
                                      Compute and Disk
                                    </InlineLink>
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                              .
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-row gap-4">
                <div>
                  <figure className="w-10 h-10 rounded-md bg-info-200 border border-info-400 flex items-center justify-center">
                    <DollarSign className="text-info" size={20} strokeWidth={2} />
                  </figure>
                </div>
                <div className="flex flex-col gap-y-1">
                  <p className="text-sm text-foreground">
                    Branch compute is billed at $
                    {withData ? branchComputeSize.priceHourly : 0}{' '}
                    per hour
                  </p>
                  <p className="text-sm text-foreground-light">
                    {withData ? (
                      <>
                        <code className="text-xs font-mono">{branchComputeSize.label}</code> compute
                        size is automatically selected to match your production branch. You may
                        downgrade after creation or pause the branch when not in use to save cost.
                      </>
                    ) : (
                      <>This cost will continue for as long as the branch has not been removed.</>
                    )}
                  </p>
                </div>
              </div>
            </DialogSection>

            <DialogFooter className="justify-end gap-2" padding="medium">
              <Button
                type="default"
                disabled={isCreatingBranch}
                onClick={() => setShowCreateBranchModal(false)}
              >
                Cancel
              </Button>
              <ButtonTooltip
                form={formId}
                disabled={isDisabled}
                loading={isCreatingBranch}
                type="primary"
                htmlType="submit"
                tooltip={{
                  content: {
                    side: 'bottom',
                  },
                }}
              >
                Create branch
              </ButtonTooltip>
            </DialogFooter>
          </form>
        </Form_Shadcn_>
      </DialogContent>
    </Dialog>
  )
}