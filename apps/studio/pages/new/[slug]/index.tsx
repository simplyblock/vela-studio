import { zodResolver } from '@hookform/resolvers/zod'
import { debounce } from 'lodash'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { NotOrganizationOwnerWarning } from 'components/interfaces/Organization/NewProject'
import { OrgNotFound } from 'components/interfaces/Organization/OrgNotFound'
import { SPECIAL_CHARS_REGEX } from 'components/interfaces/ProjectCreation/ProjectCreation.constants'
import { SpecialSymbolsCallout } from 'components/interfaces/ProjectCreation/SpecialSymbolsCallout'

import DefaultLayout from 'components/layouts/DefaultLayout'
import { WizardLayoutWithoutAuth } from 'components/layouts/WizardLayout'

import PasswordStrengthBar from 'components/ui/PasswordStrengthBar'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useAuthorizedAppsQuery } from 'data/oauth/authorized-apps-query'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { DesiredInstanceSize } from 'data/projects/new-project.constants'
import {
  ProjectCreateVariables,
  useProjectCreateMutation,
} from 'data/projects/project-create-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { withAuth } from 'hooks/misc/withAuth'
import { DEFAULT_MINIMUM_PASSWORD_STRENGTH, PROJECT_STATUS } from 'lib/constants'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { useResourceLimitDefinitionsQuery } from 'data/resource-limits/resource-limit-definitions-query'
import type { NextPageWithLayout } from 'types'

import {
  Button,
  Checkbox_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Slider_Shadcn_,
} from 'ui'

import { Eye, EyeOff } from 'lucide-react'
import { getPathReferences } from 'data/vela/path-references'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import WideWizardLayout from 'components/layouts/WideWizardLayout'
import { components } from 'data/vela/vela-schema'
import { useAvailablePostgresVersionsQuery } from 'data/platform/available-postgresql-versions-query'

/* ------------------------------------------------------------------
   Constants / schemas
-------------------------------------------------------------------*/

/* ------------------------------------------------------------------
   Constants / schemas
-------------------------------------------------------------------*/

const sizes: DesiredInstanceSize[] = ['micro', 'small', 'medium']
const sizesWithNoCostConfirmationRequired: DesiredInstanceSize[] = ['micro', 'small']

type SliderKey = 'vcpu' | 'ram' | 'nvme' | 'iops' | 'storage'

const SLIDER_CONFIG: Record<
  SliderKey,
  { label: string; min: number; max: number; step: number; unit: string; divider: number }
> = {
  vcpu: { label: 'vCPU', min: 1, max: 32, step: 1, unit: 'vCPU', divider: 1 },
  ram: { label: 'RAM', min: 1, max: 128, step: 1, unit: 'GB', divider: 1 },
  nvme: { label: 'NVMe', min: 10, max: 1000, step: 1, unit: 'GB', divider: 10 },
  iops: { label: 'IOPS', min: 1000, max: 20000, step: 1, unit: 'IOPS', divider: 500 },
  storage: { label: 'Storage', min: 50, max: 2000, step: 1, unit: 'GB', divider: 50 },
}

const FormSchema = z
  .object({
    organization: z.string({
      required_error: 'Please select an organization',
    }),
    projectName: z
      .string()
      .trim()
      .min(1, 'Please enter a project name.')
      .min(3, 'Project name must be at least 3 characters long.')
      .max(64, 'Project name must be no longer than 64 characters.'),
    postgresVersion: z
      .string({
        required_error: 'Please enter a Postgres version.',
      })
      .optional(),
    dbPassStrength: z.number(),
    dbPass: z
      .string({ required_error: 'Please enter a database password.' })
      .min(1, 'Password is required.'),
    dbPassConfirm: z.string().min(1, 'Please confirm your password.'),
    instanceSize: z.string(),
    dataApi: z.boolean(),
    useApiSchema: z.boolean(),
    postgresVersionSelection: z.string(),
    includeFileStorage: z.boolean(),
    enableHa: z.boolean(),
    readReplicas: z.number(),
    perBranchLimits: z.object({
      vcpu: z.number(),
      ram: z.number(),
      nvme: z.number(),
      iops: z.number(),
      storage: z.number(),
    }),
    projectLimits: z.object({
      vcpu: z.number(),
      ram: z.number(),
      nvme: z.number(),
      iops: z.number(),
      storage: z.number(),
    }),
  })
  .refine((vals) => vals.dbPass === vals.dbPassConfirm, {
    message: 'Passwords do not match.',
    path: ['dbPassConfirm'],
  })

export type CreateProjectForm = z.infer<typeof FormSchema>

/* ------------------------------------------------------------------
   Page component
-------------------------------------------------------------------*/

const CreateProjectPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { projectName } = useParams()
  const { slug } = getPathReferences()

  const { data: currentOrg } = useSelectedOrganizationQuery()
  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { data: availablePostgresVersions } = useAvailablePostgresVersionsQuery()

  useEffect(() => {
    if (slug === 'last-visited-org') {
      if (lastVisitedOrganization) {
        router.replace(`/new/${lastVisitedOrganization}`, undefined, { shallow: true })
      } else {
        router.replace(`/new/_`, undefined, { shallow: true })
      }
    }
  }, [slug, lastVisitedOrganization, router])

  const { mutate: sendEvent } = useSendEventMutation()

  const { data: approvedOAuthApps } = useAuthorizedAppsQuery({ slug }, { enabled: slug !== '_' })
  const hasOAuthApps = approvedOAuthApps && approvedOAuthApps.length > 0

  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')
  const [passwordStrengthWarning, setPasswordStrengthWarning] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isComputeCostsConfirmationModalVisible, setIsComputeCostsConfirmationModalVisible] =
    useState(false)

  const { data: organizations, isSuccess: isOrganizationsSuccess } = useOrganizationsQuery()

  // --- FETCH RESOURCE LIMIT DEFINITIONS ---
  const { data: limitDefinitions } = useResourceLimitDefinitionsQuery()

  // --- BUILD DYNAMIC CONFIG ---
  const limitConfig = useMemo(() => {
    if (!limitDefinitions) return SLIDER_CONFIG

    const map: Record<string, (typeof SLIDER_CONFIG)['vcpu']> = { ...SLIDER_CONFIG }

    limitDefinitions.forEach((item) => {
      // Map API resource_type to local key
      const keyMap: Record<string, SliderKey> = {
        milli_vcpu: 'vcpu',
        ram: 'ram',
        storage_size: 'storage',
        iops: 'iops',
        database_size: 'nvme',
      }

      const k = keyMap[item.resource_type]
      if (!k) return

      const step = item.step

      map[k] = {
        label: SLIDER_CONFIG[k].label,
        // branch: local min/max; project: API min/max
        min: item.min / step,
        max: item.max / step,
        step: 1,
        unit: item.unit ?? SLIDER_CONFIG[k].unit,
        divider: step,
      }
    })
    return map
  }, [limitDefinitions])

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
          project: res.id,
          organization: res.organization_id,
        },
      })
      router.push(`/org/${slug}/project/${res.id}/building`)
    },
  })

  const { data: allProjectsFromApi } = useProjectsQuery()
  const [allProjects, setAllProjects] = useState<
    components['schemas']['ProjectPublic'][] | undefined
  >(undefined)

  const organizationProjects =
    allProjects?.filter(
      (project) =>
        project.organization_id === currentOrg?.id && project.status !== PROJECT_STATUS.PAUSED
    ) ?? []

  const isAdmin = useCheckPermissions('env:projects:create')

  const isInvalidSlug = isOrganizationsSuccess && currentOrg === undefined
  const orgNotFound = isOrganizationsSuccess && (organizations?.length ?? 0) > 0 && isInvalidSlug
  const isEmptyOrganizations = (organizations?.length ?? 0) <= 0 && isOrganizationsSuccess
  const canCreateProject = isAdmin

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  async function checkPasswordStrength(value: string) {
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

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      organization: slug,
      projectName: projectName || '',
      postgresVersion: '',
      dbPass: '',
      dbPassConfirm: '',
      dbPassStrength: 0,
      instanceSize: sizes[0], // internal only
      dataApi: true,
      useApiSchema: false,
      postgresVersionSelection: '',
      includeFileStorage: false,
      enableHa: false,
      readReplicas: 0,
      perBranchLimits: {
        vcpu: 2,
        ram: 8,
        nvme: 100,
        iops: 3000,
        storage: 200,
      },
      projectLimits: {
        vcpu: 8,
        ram: 32,
        nvme: 500,
        iops: 8000,
        storage: 1000,
      },
    },
  })

  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('dbPass', password, { shouldValidate: true })
    form.setValue('dbPassConfirm', password, { shouldValidate: true })
    delayedCheckPasswordStrength(password)
  }

  const additionalMonthlySpend = 0

  const onSubmitWithComputeCostsConfirmation = async (values: CreateProjectForm) => {
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

  const onSubmit = async (values: CreateProjectForm) => {
    if (!currentOrg) {
      console.error('Unable to retrieve current organization')
      return
    }

    const { projectName, postgresVersion } = values

    const data: ProjectCreateVariables = {
      organizationSlug: currentOrg.slug,
      parameters: {
        name: values.projectName,
        max_backups: 100, // FIXME: fill in correct value
        per_branch_limits: {
          milli_vcpu: values.perBranchLimits.vcpu * limitConfig.vcpu.divider,
          ram: values.perBranchLimits.ram * limitConfig.ram.divider,
          iops: values.perBranchLimits.iops * limitConfig.iops.divider,
          database_size: values.perBranchLimits.nvme * limitConfig.nvme.divider,
          storage_size: values.perBranchLimits.storage * limitConfig.storage.divider,
        },
        project_limits: {
          milli_vcpu: values.projectLimits.vcpu * limitConfig.vcpu.divider,
          ram: values.projectLimits.ram * limitConfig.ram.divider,
          iops: values.projectLimits.iops * limitConfig.iops.divider,
          database_size: values.projectLimits.nvme * limitConfig.nvme.divider,
          storage_size: values.projectLimits.storage * limitConfig.storage.divider,
        },
      },
    }

    if (postgresVersion) {
      if (!postgresVersion.match(/1[2-9]\..*/)) {
        toast.error(
          `Invalid Postgres version, should start with a number between 12-19, a dot and additional characters, i.e. 15.2 or 15.2.0-3`
        )
      }
    }

    createProject(data)
  }

  useEffect(() => {
    if (allProjectsFromApi && !allProjects) {
      setAllProjects(allProjectsFromApi)
    }
  }, [allProjectsFromApi, allProjects, setAllProjects])

  useEffect(() => {
    if (isEmptyOrganizations) {
      router.push(`/new`)
    }
  }, [isEmptyOrganizations, router])

  useEffect(() => {
    if (slug && slug !== '_') form.setValue('organization', slug)
    if (projectName) form.setValue('projectName', projectName || '')
  }, [slug, projectName, form])

  const handleBranchSliderChange = useCallback(
    (key: SliderKey) => (value: number[]) => {
      const [next] = value
      form.setValue(`perBranchLimits.${key}`, next ?? limitConfig[key].min, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form]
  )

  const handleProjectLimitSliderChange = useCallback(
    (key: SliderKey) => (value: number[]) => {
      const [next] = value
      form.setValue(`projectLimits.${key}`, next ?? limitConfig[key].min, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form]
  )

  return (
    <Form_Shadcn_ {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitWithComputeCostsConfirmation)}
        className="flex flex-col w-full min-h-screen bg-surface text-sm "
      >
        {/* Header */}
        <header className="border-b px-12 py-6">
          <div className="max-w-[1600px] mx-auto w-full">
            <h1 className="text-lg font-semibold text-foreground">Create project</h1>
            <p className="text-sm text-foreground-muted">
              Spin up a dedicated Postgres instance, API, and storage.
            </p>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-12 py-8">
          <div className="max-w-[1600px] mx-auto w-full space-y-10">
            {/* Banners (org permission, org not found) */}
            <section>
              {isOrganizationsSuccess && !isAdmin && !orgNotFound && (
                <NotOrganizationOwnerWarning slug={slug} />
              )}
              {orgNotFound && <OrgNotFound slug={slug} />}
            </section>

            {/* ──────────────────────────────────────────────── */}
            {/* TOP ROW: Project config / Branch / Credentials  */}
            {/* ──────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 gap-10 xl:grid-cols-3 xl:items-start">
              {/* COL 1: Organization / Project / Env */}
              <div className="space-y-6">
                {isAdmin && !isInvalidSlug && (
                  <FormField_Shadcn_
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <Label_Shadcn_
                          htmlFor="organization"
                          className="text-xs font-medium text-foreground whitespace-nowrap"
                        >
                          Organization
                        </Label_Shadcn_>

                        {(organizations?.length ?? 0) > 0 && (
                          <Select_Shadcn_
                            onValueChange={(orgSlug) => {
                              field.onChange(orgSlug)
                              router.push(`/new/${orgSlug}`)
                            }}
                            value={field.value}
                            defaultValue={field.value}
                          >
                            <SelectTrigger_Shadcn_ id="organization" className="w-full h-9 text-sm">
                              <SelectValue_Shadcn_ placeholder="Select an organization" />
                            </SelectTrigger_Shadcn_>
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
                        <p className="text-[11px] leading-snug text-foreground-muted">
                          the organization this project will be created in
                        </p>
                      </div>
                    )}
                  />
                )}

                <FormField_Shadcn_
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label_Shadcn_
                        htmlFor="project-name"
                        className="text-xs font-medium text-foreground whitespace-nowrap"
                      >
                        Project name
                      </Label_Shadcn_>
                      <Input_Shadcn_
                        id="project-name"
                        placeholder="give-your-project-a-name"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </div>
                  )}
                />
              </div>

              {/* COL 3: Pg creds + custom PG version */}
              <div className="space-y-6">
                {/* Password + Confirm */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Password */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="dbPass"
                    render={({ field }) => {
                      const hasSpecialCharacters =
                        field.value.length > 0 && !field.value.match(SPECIAL_CHARS_REGEX)

                      return (
                        <div className="space-y-2 col-span-1">
                          <Label_Shadcn_
                            htmlFor="project-password"
                            className="text-xs font-medium text-foreground whitespace-nowrap"
                          >
                            Pg master password
                          </Label_Shadcn_>

                          <div className="relative">
                            <Input_Shadcn_
                              id="project-password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="new-password"
                              placeholder="give a strong password"
                              className="h-9 pr-10 text-sm"
                              {...field}
                              onChange={async (event) => {
                                field.onChange(event)
                                form.trigger('dbPassStrength')
                                const value = event.target.value
                                if (value === '') {
                                  await form.setValue('dbPassStrength', 0)
                                  await form.trigger('dbPass')
                                } else {
                                  await delayedCheckPasswordStrength(value)
                                }
                              }}
                            />
                            <button
                              type="button"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                              className="absolute inset-y-0 right-2 flex items-center text-foreground-muted"
                              onClick={() => setShowPassword((prev) => !prev)}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <div className="space-y-2">
                            {hasSpecialCharacters && <SpecialSymbolsCallout />}

                            <PasswordStrengthBar
                              passwordStrengthScore={form.getValues('dbPassStrength')}
                              password={field.value}
                              passwordStrengthMessage={passwordStrengthMessage}
                            />
                          </div>

                          <p className="text-[11px] leading-snug text-foreground-muted">
                            This is the password to your Postgres database, so it needs to be
                            strong.
                          </p>
                        </div>
                      )
                    }}
                  />

                  {/* Confirm password */}
                  <FormField_Shadcn_
                    control={form.control}
                    name="dbPassConfirm"
                    render={({ field }) => (
                      <div className="space-y-2 col-span-1">
                        <Label_Shadcn_
                          htmlFor="project-password-confirm"
                          className="text-xs font-medium text-foreground whitespace-nowrap"
                        >
                          Confirm password
                        </Label_Shadcn_>

                        <div className="relative">
                          <Input_Shadcn_
                            id="project-password-confirm"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Repeat the password"
                            className="h-9 pr-10 text-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            className="absolute inset-y-0 right-2 flex items-center text-foreground-muted"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Generate password CTA */}
                <div>
                  <Button type="default" size="tiny" htmlType="button" onClick={generatePassword}>
                    Generate strong password
                  </Button>
                </div>

                <FormField_Shadcn_
                  control={form.control}
                  name="postgresVersion"
                  render={({ field }) => {
                    const availableVersions = availablePostgresVersions || []
                    const defaultVersion = availableVersions.find(version => version.default)?.value || ''
                    return (
                      <div className="space-y-2">
                        <Label_Shadcn_
                          htmlFor="custom-pg-version"
                          className="text-xs font-medium text-foreground whitespace-nowrap"
                        >
                          Custom Postgres version
                        </Label_Shadcn_>
                        <Select_Shadcn_
                          disabled={availableVersions.length < 2}
                          value={defaultVersion}
                        >
                          <SelectTrigger_Shadcn_>
                            <SelectValue_Shadcn_ placeholder="Select PostgreSQL version" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {availableVersions.map((version) => {
                              return (
                                <SelectItem_Shadcn_ value={version.value}>
                                  {version.label}
                                </SelectItem_Shadcn_>
                              )
                            })}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </div>
                    )
                  }}
                />
              </div>
            </section>

            {/* ──────────────────────────────────────────────── */}
            {/* SECOND ROW: Branch sizing  |  Project limits    */}
            {/* ──────────────────────────────────────────────── */}
            <section className="grid gap-10 xl:grid-cols-2">
              {/* Branch sizing card */}
              <section className="rounded-lg border p-5 space-y-4">
                <p className="font-medium text-sm text-foreground">Sizing (per branch)</p>

                <div className="grid grid-cols-1 gap-y-4">
                  {(Object.keys(SLIDER_CONFIG) as SliderKey[]).map((key) => {
                    const { label, min, max, step, unit } = limitConfig[key]
                    const value = form.watch(`perBranchLimits.${key}`)

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-[12px] leading-none">
                          <Label_Shadcn_
                            htmlFor={`sizing-${key}`}
                            className="text-foreground whitespace-nowrap pr-2"
                          >
                            {label}
                          </Label_Shadcn_>
                          <span className="text-foreground-muted whitespace-nowrap">
                            {value} {unit}
                          </span>
                        </div>
                        <Slider_Shadcn_
                          id={`sizing-${key}`}
                          min={min}
                          max={max}
                          step={step}
                          value={[value]}
                          onValueChange={handleBranchSliderChange(key)}
                        />
                      </div>
                    )
                  })}
                </div>

                <p className="text-[11px] leading-snug text-foreground-muted">
                  Resource allocation for this branch. These values will eventually control cost and
                  performance.
                </p>
              </section>

              {/* Project limits card */}
              <section className="rounded-lg border p-5 space-y-4">
                <p className="font-medium text-sm text-foreground">Project limits</p>

                <div className="grid grid-cols-1 gap-y-4">
                  {(Object.keys(SLIDER_CONFIG) as SliderKey[]).map((key) => {
                    const { label, min, max, step, unit } = limitConfig[key]
                    const value = form.watch(`projectLimits.${key}`)

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-[12px] leading-none">
                          <Label_Shadcn_
                            htmlFor={`project-limits-${key}`}
                            className="text-foreground whitespace-nowrap pr-2"
                          >
                            {label}
                          </Label_Shadcn_>
                          <span className="text-foreground-muted whitespace-nowrap">
                            {value} {unit}
                          </span>
                        </div>
                        <Slider_Shadcn_
                          id={`project-limits-${key}`}
                          min={min}
                          max={max}
                          step={step}
                          value={[value]}
                          onValueChange={handleProjectLimitSliderChange(key)}
                        />
                      </div>
                    )
                  })}
                </div>

                <p className="text-[11px] leading-snug text-foreground-muted">
                  Global ceilings across all branches in this project.
                </p>
              </section>
            </section>

            {/* ──────────────────────────────────────────────── */}
            {/* THIRD ROW: Availability & storage (full width)  */}
            {/* ──────────────────────────────────────────────── */}
            <section className="rounded-lg border p-5 space-y-6">
              <div className="space-y-4">
                <p className="font-medium text-sm text-foreground">Availability &amp; storage</p>

                <div className="flex items-start gap-3 text-sm">
                  <FormField_Shadcn_
                    control={form.control}
                    name="includeFileStorage"
                    render={({ field }) => (
                      <>
                        <Checkbox_Shadcn_
                          id="include-file-storage"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                        <Label_Shadcn_
                          htmlFor="include-file-storage"
                          className="text-foreground text-xs font-medium leading-tight"
                        >
                          Include file storage
                        </Label_Shadcn_>
                      </>
                    )}
                  />
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <FormField_Shadcn_
                    control={form.control}
                    name="enableHa"
                    render={({ field }) => (
                      <>
                        <Checkbox_Shadcn_
                          id="enable-ha"
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                        />
                        <Label_Shadcn_
                          htmlFor="enable-ha"
                          className="text-foreground text-xs font-medium leading-tight whitespace-nowrap"
                        >
                          Enable high availability
                        </Label_Shadcn_>
                      </>
                    )}
                  />
                </div>

                <FormField_Shadcn_
                  control={form.control}
                  name="readReplicas"
                  render={({ field }) => (
                    <div className="space-y-1 max-w-[200px]">
                      <Label_Shadcn_
                        htmlFor="read-replicas"
                        className="text-xs font-medium text-foreground whitespace-nowrap"
                      >
                        Read replicas
                      </Label_Shadcn_>
                      <Input_Shadcn_
                        id="read-replicas"
                        type="number"
                        value={field.value}
                        disabled
                        readOnly
                        className="h-9 text-sm"
                      />
                      <p className="text-[11px] leading-snug text-foreground-muted">Coming soon</p>
                    </div>
                  )}
                />
              </div>

              <div className="rounded-md border p-3 text-[11px] leading-snug text-foreground-muted">
                <p>
                  This project may incur usage-based costs once created. Review your organization’s
                  billing plan and limits.{' '}
                  <Link
                    href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                    target="_blank"
                    className="underline"
                  >
                    Learn more
                  </Link>
                  .
                </p>
              </div>
            </section>
          </div>
        </main>

        {/* Sticky footer with actions */}
        <footer className="sticky bottom-0 border-t bg-surface/90 backdrop-blur px-12 py-4">
          <div className="max-w-[1600px] mx-auto w-full flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 sm:ml-auto">
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
                type="primary"
              >
                Create project
              </Button>
            </div>
          </div>
        </footer>

        {/* Confirmation modal */}
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
              Creating this project can increase your monthly costs by ${additionalMonthlySpend},
              independent of how actively you use it. By clicking "I understand", you agree to the
              additional costs.{' '}
              <Link
                href="https://supabase.com/docs/guides/platform/manage-your-usage/compute"
                target="_blank"
                className="underline"
              >
                Compute costs
              </Link>{' '}
              are non-refundable.
            </p>
          </div>
        </ConfirmationModal>
      </form>
    </Form_Shadcn_>
  )
}

/* ------------------------------------------------------------------
   Helpers / Layout wrappers
-------------------------------------------------------------------*/

const instanceLabel = (_instance: string | undefined): string => {
  return 'Micro'
}

const PageLayout = withAuth(({ children }: PropsWithChildren) => {
  return <WizardLayoutWithoutAuth>{children}</WizardLayoutWithoutAuth>
})

CreateProjectPage.getLayout = (page) => (
  <DefaultLayout headerTitle="New project">
    <WideWizardLayout>{page}</WideWizardLayout>
  </DefaultLayout>
)

export default CreateProjectPage
