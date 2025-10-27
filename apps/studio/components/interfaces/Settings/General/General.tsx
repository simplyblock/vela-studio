import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { FormActions } from 'components/ui/Forms/FormActions'
import { FormPanel } from 'components/ui/Forms/FormPanel'
import { FormSection, FormSectionContent, FormSectionLabel } from 'components/ui/Forms/FormSection'
import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useProjectByRefQuery, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  Form,
  Input,
  WarningIcon,
} from 'ui'
import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const General = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const isBranch = true // FIXME: Do we still need this?

  const formId = 'project-general-settings'
  const initialValues = { name: project?.name ?? '', ref: project?.id ?? '' }
  const { can: canUpdateProject } = useCheckPermissions("project:settings:write")

  const { mutate: updateProject, isLoading: isUpdating } = useProjectUpdateMutation()

  const onSubmit = async (values: any, { resetForm }: any) => {
    if (!project?.id) return console.error('Ref is required')
    if (!organization?.slug) return console.error('Slug is required')

    updateProject(
      { orgRef: organization.slug, ref: project.id, name: values.name.trim() },
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
      {project === undefined ? (
        <GenericSkeletonLoader />
      ) : (
        <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
          {({ handleReset, values, initialValues }: any) => {
            const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
            return (
              <FormPanel
                disabled={!canUpdateProject}
                footer={
                  <div className="flex py-4 px-8">
                    <FormActions
                      form={formId}
                      isSubmitting={isUpdating}
                      hasChanges={hasChanges}
                      handleReset={handleReset}
                      helper={
                        !canUpdateProject
                          ? "You need additional permissions to manage this project's settings"
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
                      label="Project name"
                      disabled={isBranch || !canUpdateProject}
                    />
                    <Input copy disabled id="ref" size="small" label="Project ID" />
                  </FormSectionContent>
                </FormSection>
              </FormPanel>
            )
          }}
        </Form>
      )}
      {!isBranch && (
        <>
          <div className="mt-6" id="restart-project">
            <FormPanel>
              <div className="flex flex-col px-8 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">Restart project</p>
                    <div className="max-w-[420px]">
                      <p className="text-sm text-foreground-light">
                        Your project will not be available for a few minutes.
                      </p>
                    </div>
                  </div>
                  <RestartServerButton />
                </div>
              </div>
              <div
                className="flex w-full items-center justify-between px-8 py-4"
                id="pause-project"
              >
                <div>
                  <p className="text-sm">Pause project</p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be accessible while it is paused.
                    </p>
                  </div>
                </div>
                <PauseProjectButton />
              </div>
            </FormPanel>
          </div>
          <div className="mt-6">
            <Panel>
              <Panel.Content>
                <div className="flex justify-between">
                  <div className="flex space-x-4">
                    <BarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics have been moved</p>
                      <p className="text-foreground-light text-sm">
                        You may view your project's usage under your organization's settings
                      </p>
                    </div>
                  </div>
                  <div>
                    <Button asChild type="default">
                      <Link href={`/org/${organization?.slug}/usage?projectRef=${project?.id}`}>
                        View project usage
                      </Link>
                    </Button>
                  </div>
                </div>
              </Panel.Content>
            </Panel>
          </div>
        </>
      )}
    </div>
  )
}

export default General
