import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { Button, Form, Input } from 'ui'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useBranchUpdateMutation } from '../../../../data/branches/branch-update-mutation'

const General = () => {
  const { data: branch } = useSelectedBranchQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const isBranch = true // FIXME: Do we still need this?

  const formId = 'branch-general-settings'
  const initialValues = { name: branch?.name ?? '', ref: branch?.id ?? '' }
  const { can: canUpdateBranch } = useCheckPermissions('branch:settings:write')

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation()

  const onSubmit = async (values: any, { resetForm }: any) => {
    if (!branch) return console.error('Branch is required')

    updateBranch(
      {
        orgRef: branch.organization_id,
        projectRef: branch.project_id,
        branchRef: branch.id,
        name: values.name.trim(),
      },
      {
        onSuccess: ({ name }) => {
          resetForm({ values: { name }, initialValues: { name } })
          toast.success('Successfully saved settings')
        },
      }
    )
  }

  return (
    <div>
      {!branch ? (
        <GenericSkeletonLoader />
      ) : (
        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={!canUpdateBranch}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdating}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      helper={
                        !canUpdateBranch
                          ? "You need additional permissions to manage this branch's settings"
                          : undefined
                      }
                    />
                  </div>
                }
              >
                <FormSection header={<FormSectionLabel>General settings</FormSectionLabel>}>
                  <FormSectionContent loading={false}>
                    <Input
                      id="name"
                      size="small"
                      label="Branch name"
                      disabled={!isBranch || !canUpdateBranch}
                    />
                    <Input copy disabled id="ref" size="small" label="Branch Id" />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )
          }}
        </Form>
      )}
      {!isBranch && (
        <>
          <div className="mt-6" id="restart-branch">
            <FormPanel>
              <div className="flex flex-col px-8 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Restart branch</p>
                    <div className="max-w-[420px]">
                      <p className="text-sm text-foreground-light">
                        Your branch will not be available for a few minutes.
                      </p>
                    </div>
                  </div>
                  <RestartServerButton />
                </div>
              </div>
              <div
                className="flex w-full items-center justify-between px-8 py-4"
                id="pause-branch"
              >
                <div>
                  <p className="text-sm">Pause branch</p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your branch will not be accessible while it is paused.
                    </p>
                  </div>
                </div>
                <PauseProjectButton />
              </div>
            </FormPanel>
          </div>
        </>
      )}
    </div>
  )
}

export default General
