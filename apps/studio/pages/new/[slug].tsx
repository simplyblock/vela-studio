import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { components } from 'api-types'
import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { NotOrganizationOwnerWarning } from 'components/interfaces/Organization/NewProject'
import { OrgNotFound } from 'components/interfaces/Organization/OrgNotFound'
import { AdvancedConfiguration } from 'components/interfaces/ProjectCreation/AdvancedConfiguration'
import {
  extractPostgresVersionDetails,
  PostgresVersionSelector,
} from 'components/interfaces/ProjectCreation/PostgresVersionSelector'
import { SPECIAL_CHARS_REGEX } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { SecurityOptions } from 'components/interfaces/ProjectCreation/SecurityOptions'
import { SpecialSymbolsCallout } from 'components/interfaces/ProjectCreation/SpecialSymbolsCallout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'
import Panel from 'components/ui/Panel'
import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import { useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { DesiredInstanceSize } from 'data/projects/new-project.constants'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH, PROJECT_STATUS } from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import type { NextPageWithLayout } from 'types'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { getPathReferences } from 'data/vela/path-references'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const sizes: DesiredInstanceSize[] = ['micro', 'small', 'medium']

const sizesWithNoCostConfirmationRequired: DesiredInstanceSize[] = ['micro', 'small']

const FormSchema = z.object({
  organization: z.string({
    required_error: 'Please select an organization',
  }),
  projectName: z
    .string()
    .trim()
    .min(1, 'Please enter a project name.') // Required field check
    .min(3, 'Project name must be at least 3 characters long.') // Minimum length check
    .max(64, 'Project name must be no longer than 64 characters.'), // Maximum length check
  postgresVersion: z.string({
    required_error: 'Please enter a Postgres version.',
  }),
  dbPassStrength: z.number(),
  dbPass: z
    .string({ required_error: 'Please enter a database password.' })
    .min(1, 'Password is required.'),
  instanceSize: z.string(),
  dataApi: z.boolean(),
  useApiSchema: z.boolean(),
  postgresVersionSelection: z.string(),
})

export type CreateProjectForm = z.infer<typeof FormSchema>

const Wizard: NextPageWithLayout = () => {
  const router = useRouter()
  const { projectName } = useParams()
  const { slug } = getPathReferences()
  const { data: currentOrg } = useSelectedOrganizationQuery()
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const showAdvancedConfig = useIsFeatureEnabled('project_creation:show_advanced_config')

  // This is to make the database.new redirect work correctly. The database.new redirect should be set to supabase.com/dashboard/new/last-visited-org
  if (slug === 'last-visited-org') {
    if (lastVisitedOrganization) {
      router.replace(`/new/${lastVisitedOrganization}`, undefined, { shallow: true })
    } else {
      router.replace(`/new/_`, undefined, { shallow: true })
    }
  }

  const { mutate: sendEvent } = useSendEventMutation()

  const { data: approvedOAuthApps } = useAuthorizedAppsQuery({ slug }, { enabled: slug !== '_' })

  const hasOAuthApps = approvedOAuthApps && approvedOAuthApps.length > 0

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const [isComputeCostsConfirmationModalVisible, setIsComputeCostsConfirmationModalVisible] =
    useState(false)

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()

  const {
    mutate: createProject,
    isLoading: isCreatingNewProject,
    isSuccess: isSuccessNewProject,
  } = useProjectCreateMutation({
    onSuccess: (res) => {
      sendEvent({
        action: 'project_creation_simple_version_submitted',
        properties: {
          instanceSize: form.getValues('instanceSize'),
        },
        groups: {
          project: res.ref,
          organization: res.organization_slug,
        },
      })
      router.push(`/org/${slug}/project/${res.ref}/building`)
    },
  })

  const { data: allProjectsFromApi } = useProjectsQuery()
  const [allProjects, setAllProjects] = useState<
    components['schemas']['ProjectInfo'][] | undefined
  >(undefined)

  const organizationProjects =
    allProjects?.filter(
      (project) =>
        project.organization_id === currentOrg?.id && project.status !== PROJECT_STATUS.INACTIVE
    ) ?? []

  const isAdmin = useCheckPermissions("env:projects:create")

  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const orgNotFound = isOrganizationsSuccess && (organizations?.length ?? 0) > 0 && isInvalidSlug
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess

  const showNonProdFields = process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod'

  const canCreateProject = isAdmin

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: any) {
    const { message, warning, strength } = await passwordStrength(value)

    form.setValue('dbPassStrength', strength)
    form.trigger('dbPassStrength')
    form.trigger('dbPass')

    setPasswordStrengthWarning(warning)
    setPasswordStrengthMessage(message)
  }

  FormSchema.superRefine(({ dbPassStrength }, refinementContext) => {
    if (dbPassStrength < DEFAULT_MINIMUM_PASSWORD_STRENGTH) {
      refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dbPass'],
        message: passwordStrengthWarning || 'Password not secure enough',
      })
    }
  })

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      organization: slug,
      projectName: projectName || '',
      postgresVersion: '',
      dbPass: '',
      dbPassStrength: 0,
      instanceSize: sizes[0],
      dataApi: true,
      useApiSchema: false,
      postgresVersionSelection: '',
    },
  })

  const { instanceSize } = form.watch()

  // [Refactor] DB Password could be a common component used in multiple pages with repeated logic
  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password)
    delayedCheckPasswordStrength(password)
  }

  const onSubmitWithComputeCostsConfirmation = async (values: z.infer<typeof FormSchema>) => {
    const launchingLargerInstance =
      values.instanceSize &&
      !sizesWithNoCostConfirmationRequired.includes(values.instanceSize as DesiredInstanceSize)
    if (additionalMonthlySpend > 0 && (hasOAuthApps || launchingLargerInstance)) {
      sendEvent({
        action: 'project_creation_simple_version_confirm_modal_opened',
        properties: {
          instanceSize: values.instanceSize,
        },
        groups: {
          organization: currentOrg?.slug ?? 'Unknown',
        },
      })
      setIsComputeCostsConfirmationModalVisible(true)
    } else {
      await onSubmit(values)
    }
  }

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    if (!currentOrg) return console.error('Unable to retrieve current organization')

    const {
      projectName,
      dbPass,
      postgresVersion,
      dataApi,
      useApiSchema,
      postgresVersionSelection,
    } = values

    const { postgresEngine, releaseChannel } =
      extractPostgresVersionDetails(postgresVersionSelection)

    const data: ProjectCreateVariables = {
      dbPass,
      organizationSlug: currentOrg.slug,
      name: projectName,
      // gets ignored due to org billing subscription anyway
      dbPricingTierId: 'tier_free',
      // only set the compute size on pro+ plans. Free plans always use micro (nano in the future) size.
      dbInstanceSize: undefined,
      dataApiExposedSchemas: !dataApi ? [] : undefined,
      dataApiUseApiSchema: !dataApi ? false : useApiSchema,
      postgresEngine: postgresEngine,
      releaseChannel: releaseChannel,
    }

    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        toast.error(
          `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`
        )
      }

      data['customSupabaseRequest'] = {
        ami: { search_tags: { 'tag:postgresVersion': postgresVersion } },
      }
    }

    createProject(data)
  }

  useEffect(() => {
    // Only set once to ensure compute credits dont change while project is being created
    if (allProjectsFromApi && !allProjects) {
      setAllProjects(allProjectsFromApi)
    }
  }, [allProjectsFromApi, allProjects, setAllProjects])

  useEffect(() => {
    // Handle no org: redirect to new org route
    if (isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, router])

  useEffect(() => {
    // [Joshen] Cause slug depends on router which doesnt load immediately on render
    // While the form data does load immediately
    if (slug && slug !== '_') form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
  }, [slug])

  const additionalMonthlySpend = 0

  return (
    <Form_Shadcn_ {...form}>
      <form onSubmit={form.handleSubmit(onSubmitWithComputeCostsConfirmation)}>
        <Panel
          loading={!isOrganizationsSuccess}
          title={
            <div key="panel-title">
              <h3>Create a new project</h3>
              <p className="text-sm text-foreground-lighter">
                Your project will have its own dedicated instance and full Postgres database.
                <br />
                An API will be set up so you can easily interact with your new database.
                <br />
              </p>
            </div>
          }
          footer={
            <div key="panel-footer" className="grid grid-cols-12 w-full gap-4 items-center">
              <div className="flex items-end col-span-8 space-x-2 ml-auto">
                <Button
                  type="default"
                  disabled={isCreatingNewProject || isSuccessNewProject}
                  onClick={() => {
                    if (!!lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
                    else router.push('/organizations')
                  }}
                >
                  Cancel
                </Button>
                <Button
                  htmlType="submit"
                  loading={isCreatingNewProject || isSuccessNewProject}
                  disabled={!canCreateProject || isCreatingNewProject || isSuccessNewProject}
                >
                  Create new project
                </Button>
              </div>
            </div>
          }
        >
          <>
            <div className="divide-y divide-border-muted">
              <Panel.Content className={['space-y-4'].join(' ')}>
                {isAdmin && !isInvalidSlug && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItemLayout label="Organization" layout="horizontal">
                        {(organizations?.length ?? 0) > 0 && (
                          <Select_Shadcn_
                            onValueChange={(slug) => {
                              field.onChange(slug)
                              router.push(`/new/${slug}`)
                            }}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <FormControl_Shadcn_>
                              <SelectTrigger_Shadcn_>
                                <SelectValue_Shadcn_ placeholder="Select an organization" />
                              </SelectTrigger_Shadcn_>
                            </FormControl_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectGroup_Shadcn_>
                                {organizations?.map((x) => (
                                  <SelectItem_Shadcn_
                                    key={x.id}
                                    value={x.slug}
                                    className="flex justify-between"
                                  >
                                    <span className="mr-2">{x.name}</span>
                                  </SelectItem_Shadcn_>
                                ))}
                              </SelectGroup_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        )}
                      </FormItemLayout>
                    )}
                  />
                )}

                {isOrganizationsSuccess && !isAdmin && !orgNotFound && (
                  <NotOrganizationOwnerWarning slug={slug} />
                )}
                {orgNotFound && <OrgNotFound slug={slug} />}
              </Panel.Content>

              {canCreateProject && (
                <>
                  <Panel.Content>
                    <FormField_Shadcn_
                      control={form.control}
                      name="projectName"
                      render={({ field }) => (
                        <FormItemLayout label="Project name" layout="horizontal">
                          <FormControl_Shadcn_>
                            <Input_Shadcn_ {...field} placeholder="Project name" />
                          </FormControl_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </Panel.Content>

                  <Panel.Content>
                    <FormField_Shadcn_
                      control={form.control}
                      name="instanceSize"
                      render={({ field }) => (
                        <FormItemLayout
                          layout="horizontal"
                          label={
                            <div className="flex flex-col gap-y-4">
                              <span>Compute Size</span>
                            </div>
                          }
                          description={
                            <>
                              <p>
                                The default size of your project's databases. You can change this later.
                              </p>
                            </>
                          }
                        >
                          <Select_Shadcn_
                            value={field.value}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger_Shadcn_ className="[&_.instance-details]:hidden">
                              <SelectValue_Shadcn_ placeholder="Select a compute size" />
                            </SelectTrigger_Shadcn_>
                            <SelectContent_Shadcn_>
                              <SelectGroup_Shadcn_>
                                <SelectItem_Shadcn_
                                  key={'disabled'}
                                  value={'disabled'}
                                  disabled
                                >
                                  <div className="flex items-center justify-center w-full">
                                    <span>Larger instance sizes available after creation</span>
                                  </div>
                                </SelectItem_Shadcn_>
                              </SelectGroup_Shadcn_>
                            </SelectContent_Shadcn_>
                          </Select_Shadcn_>
                        </FormItemLayout>
                      )}
                    />
                  </Panel.Content>

                  <Panel.Content>
                    <FormField_Shadcn_
                      control={form.control}
                      name="dbPass"
                      render={({ field }) => {
                        const hasSpecialCharacters =
                          field.value.length > 0 && !field.value.match(SPECIAL_CHARS_REGEX)

                        return (
                          <FormItemLayout
                            label="Database Password"
                            layout="horizontal"
                            description={
                              <>
                                {hasSpecialCharacters && <SpecialSymbolsCallout />}
                                <PasswordStrengthBar
                                  passwordStrengthScore={form.getValues('dbPassStrength')}
                                  password={field.value}
                                  passwordStrengthMessage={passwordStrengthMessage}
                                  generateStrongPassword={generatePassword}
                                />
                              </>
                            }
                          >
                            <FormControl_Shadcn_>
                              <Input
                                copy={field.value.length > 0}
                                type="password"
                                placeholder="Type in a strong password"
                                {...field}
                                autoComplete="off"
                                onChange={async (event) => {
                                  field.onChange(event)
                                  form.trigger('dbPassStrength')
                                  const value = event.target.value
                                  if (event.target.value === '') {
                                    await form.setValue('dbPassStrength', 0)
                                    await form.trigger('dbPass')
                                  } else {
                                    await delayedCheckPasswordStrength(value)
                                  }
                                }}
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )
                      }}
                    />
                  </Panel.Content>

                  <Panel.Content>
                    <FormField_Shadcn_
                      control={form.control}
                      name="postgresVersionSelection"
                      render={({ field }) => (
                        <PostgresVersionSelector
                          field={field}
                          form={form}
                          organizationSlug={slug}
                        />
                      )}
                    />
                  </Panel.Content>

                  {showNonProdFields && (
                    <Panel.Content>
                      <FormField_Shadcn_
                        control={form.control}
                        name="postgresVersion"
                        render={({ field }) => (
                          <FormItemLayout
                            label="Custom Postgres version"
                            layout="horizontal"
                            description="Specify a custom version of Postgres (Defaults to the latest). This is only applicable for local/staging projects"
                          >
                            <FormControl_Shadcn_>
                              <Input_Shadcn_
                                placeholder="Postgres version"
                                {...field}
                                autoComplete="off"
                              />
                            </FormControl_Shadcn_>
                          </FormItemLayout>
                        )}
                      />
                    </Panel.Content>
                  )}

                  <SecurityOptions form={form} />
                  {
                    /* //FIXME: Hard disabled for now */ false && showAdvancedConfig && (
                      <AdvancedConfiguration form={form} />
                    )
                  }
                </>
              )}
            </div>
          </>
        </Panel>

        <ConfirmationModal
          size="large"
          loading={false}
          visible={isComputeCostsConfirmationModalVisible}
          title="Confirm compute costs"
          confirmLabel="I understand"
          onCancel={() => setIsComputeCostsConfirmationModalVisible(false)}
          onConfirm={async () => {
            const values = form.getValues()
            await onSubmit(values)
            setIsComputeCostsConfirmationModalVisible(false)
          }}
          variant={'warning'}
        >
          <div className="text-sm text-foreground-light space-y-1">
            <p>
              Launching a project on compute size "{instanceLabel(instanceSize)}" increases your
              monthly costs by ${additionalMonthlySpend}, independent of how actively you use it. By
              clicking "I understand", you agree to the additional costs.{' '}
              <Link
                href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                target="_blank"
                className="underline"
              >
                Compute Costs
              </Link>{' '}
              are non-refundable.
            </p>
          </div>
        </ConfirmationModal>
      </form>
    </Form_Shadcn_>
  )
}

const instanceLabel = (instance: string | undefined): string => {
  return 'Micro'
}

const PageLayout = withAuth(({ children }: PropsWithChildren) => {
  return <WizardLayoutWithoutAuth>{children}</WizardLayoutWithoutAuth>
})

Wizard.getLayout = (page) => (
  <DefaultLayout headerTitle="New project">
    <PageLayout>{page}</PageLayout>
  </DefaultLayout>
)

export default Wizard
