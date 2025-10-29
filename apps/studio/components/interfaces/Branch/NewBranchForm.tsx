import { useRouter } from 'next/router'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { useParams } from 'common'
import Panel from 'components/ui/Panel'
import {
  Button,
  Checkbox_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Slider_Shadcn_,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useAvailablePostgresVersionsQuery } from 'data/platform/available-postgresql-versions-query'
import { ProjectLimitsData, useProjectLimitsQuery } from 'data/resources/project-limits-query'
import { ArrayElement } from 'types'
import { useResourceLimitDefinitionsQuery } from 'data/resource-limits/resource-limit-definitions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { SPECIAL_CHARS_REGEX } from '../ProjectCreation/ProjectCreation.constants'
import { Eye, EyeOff } from 'lucide-react'
import { SpecialSymbolsCallout } from '../ProjectCreation/SpecialSymbolsCallout'
import PasswordStrengthBar from '../../ui/PasswordStrengthBar'
import { debounce } from 'lodash'
import passwordStrength from 'lib/password-strength'
import { generateStrongPassword } from 'lib/project'
import { useBranchCreateMutation } from 'data/branches/branch-create-mutation'

interface SliderSpecification {
  label: string
  min: number
  max: number
  step: number
  unit: string
  divider: number
}

type EnvironmentType = {
  label: string
  value: string
}

interface NewBranchFormProps {}

const sliderNames = {
  milli_vcpu: 'Assigned vCPU',
  ram: 'RAM',
  iops: 'IOPS',
  database_size: 'Database size',
  storage_size: 'Storage size',
}

const FormSchema = z.object({
  name: z.string().min(1),
  postgresVersion: z.string(),
  environmentType: z.string(),
  databasePassword: z.string(),
  databasePasswordStrength: z.number(),
  enableStorageService: z.boolean(),
  enableHighAvailability: z.boolean(),
  readReplicas: z.number(),
  resources: z.object({
    milli_vcpu: z.number(),
    ram: z.number(),
    database_size: z.number(),
    iops: z.number(),
    storage_size: z.number(),
  }),
})

type FormState = z.infer<typeof FormSchema>

type ResourceType = ArrayElement<ProjectLimitsData>['resource']

const NewBranchForm = ({}: NewBranchFormProps) => {
  const { slug, ref } = useParams()

  const router = useRouter()

  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()
  const { data: projectLimits } = useProjectLimitsQuery({ orgSlug: slug, projectRef: ref })

  const { data: resourceLimitsDefinitions } = useResourceLimitDefinitionsQuery()
  const { data: availablePostgresVersions } = useAvailablePostgresVersionsQuery()

  const [newBranchLoading, setNewBranchLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrengthMessage, setPasswordStrengthMessage] = useState('')

  const { mutate: createBranch } = useBranchCreateMutation({
    onSuccess: (data) => {
      onBranchCreated(data)
    },
  })

  const makeLimit = (
    resourceType: ResourceType,
    limits: ProjectLimitsData
  ): SliderSpecification => {
    const systemDefinition = (resourceLimitsDefinitions || []).find(
      (limit) => limit.resource_type === resourceType
    )
    if (!systemDefinition)
      return { label: resourceType, min: 0, max: 0, step: 1, unit: '', divider: 1 }

    const projectLimit = (limits || []).find((limit) => limit.resource === resourceType)
    if (!projectLimit) {
      return {
        label: resourceType,
        min: systemDefinition.min / systemDefinition.step,
        max: systemDefinition.max / systemDefinition.step,
        step: 1,
        unit: systemDefinition.unit || 'IOPS',
        divider: systemDefinition.step,
      }
    }

    const { max_per_branch } = projectLimit
    const { min, step, unit } = systemDefinition
    return {
      label: sliderNames[resourceType],
      min: min / step,
      max: (max_per_branch ?? 0) / step,
      step: 1,
      unit: unit || 'IOPS',
      divider: step,
    }
  }

  const limits = useMemo(() => {
    const t = {
      milli_vcpu: makeLimit('milli_vcpu', projectLimits),
      ram: makeLimit('ram', projectLimits),
      iops: makeLimit('iops', projectLimits),
      database_size: makeLimit('database_size', projectLimits),
      storage_size: makeLimit('storage_size', projectLimits),
    }
    return t
  }, [projectLimits, resourceLimitsDefinitions])

  let environments: EnvironmentType[] = []
  if (org) {
    const envTypes: string[] = org.env_types

    environments = [
      ...envTypes.map((type) => ({
        label: type,
        value: type,
      })),
    ]
  }

  const [isOrgCreationConfirmationModalVisible, setIsOrgCreationConfirmationModalVisible] =
    useState(false)

  const form = useForm<FormState>({
    resolver: zodResolver(FormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      postgresVersion: '',
      environmentType: '',
      databasePassword: '',
      databasePasswordStrength: 0,
      enableStorageService: false,
      enableHighAvailability: false,
      readReplicas: 0,
      resources: {
        milli_vcpu: 0,
        ram: 0,
        database_size: 0,
        iops: 0,
        storage_size: 0,
      },
    },
  })

  const [searchParams] = useQueryStates({
    returnTo: parseAsString.withDefault(''),
    auth_id: parseAsString.withDefault(''),
  })

  useEffect(() => {
    if (!availablePostgresVersions) return
    const defaultVersion = availablePostgresVersions.find((version) => version.default)?.value
    if (!defaultVersion) return
    form.setValue('postgresVersion', defaultVersion)
  }, [availablePostgresVersions])

  useEffect(() => {
    if (!router.isReady) return

    const { name } = router.query

    if (typeof name === 'string') form.setValue('name', name)
  }, [router.isReady])

  const onBranchCreated = (branch: { id: string } | undefined) => {
    if (searchParams.returnTo && searchParams.auth_id) {
      router.push(`${searchParams.returnTo}?auth_id=${searchParams.auth_id}`, undefined, {
        shallow: false,
      })
    } else {
      if (!branch) router.push(`/org/${slug}/project/${ref}`)
      else router.push(`/org/${slug}/project/${ref}/branch/${branch.id}`)
    }
  }

  const handleBranchSliderChange = useCallback(
    (key: ResourceType) => (value: number[]) => {
      const [next] = value
      form.setValue(`resources.${key}`, next ?? limits[key].min, {
        shouldDirty: true,
        shouldValidate: false,
      })
    },
    [form]
  )

  function validateBranchName(name: any) {
    const value = name ? name.trim() : ''
    return value.length >= 1
  }

  const checkPasswordStrength = async (value: string) => {
    const { message, warning, strength } = await passwordStrength(value)

    form.setValue('databasePasswordStrength', strength)
    form.trigger('databasePasswordStrength')
    form.trigger('databasePassword')

    setPasswordStrengthMessage(message)
  }

  const delayedCheckPasswordStrength = useRef(
    debounce((value) => checkPasswordStrength(value), 300)
  ).current

  async function onSubmit(values: FormState) {
    const isBranchNameValid = validateBranchName(values.name)
    if (!isBranchNameValid) {
      return toast.error('Branch name is empty')
    }

    if (!slug || !ref) return

    setNewBranchLoading(true)
    createBranch(
      {
        orgRef: slug,
        projectRef: ref,
        branchName: values.name,
        deployment: {
          database_password: values.databasePassword,
          database_size: values.resources.database_size * limits.database_size.divider,
          storage_size: values.enableStorageService ? values.resources.storage_size * limits.storage_size.divider : undefined,
          milli_vcpu: values.resources.milli_vcpu * limits.milli_vcpu.divider,
          memory_bytes: values.resources.ram * limits.ram.divider,
          iops: values.resources.iops * limits.iops.divider,
          database_image_tag: values.postgresVersion as any,
          enable_file_storage: values.enableStorageService,
        },
      },
      {
        onSuccess: (data) => {
          setNewBranchLoading(false)
          if (data) router.push(`/org/${slug}/project/${ref}/branch/${data?.id}`)
          else router.push(`/org/${slug}/project/${ref}`)
        },
        onError: (data) => {
          setNewBranchLoading(false)
          toast.error(data.message, { duration: 10_000 })
        },
      }
    )
  }

  function generatePassword() {
    const password = generateStrongPassword()
    form.setValue('databasePassword', password, { shouldValidate: true })
    delayedCheckPasswordStrength(password)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Panel
        title={
          <div key="panel-title">
            <h4>Create a new branch</h4>
          </div>
        }
        footer={
          <div key="panel-footer" className="flex w-full items-center justify-between">
            <Button
              type="default"
              disabled={newBranchLoading}
              onClick={() => {
                router.push(`/org/${project?.organization_id}/project/${project?.id}`)
              }}
            >
              Cancel
            </Button>
            <div className="flex items-center space-x-3">
              <p className="text-xs text-foreground-lighter">You can rename your branch later</p>
              <Button
                htmlType="submit"
                type="primary"
                loading={newBranchLoading}
                disabled={newBranchLoading}
              >
                Create branch
              </Button>
            </div>
          </div>
        }
        className="overflow-visible"
      >
        <Panel.Content>
          <p className="text-sm">This will be your new branch in project {project?.name}.</p>
        </Panel.Content>
        <Panel.Content className="Form section-block--body has-inputs-centered">
          <div className="grid grid-cols-2 w-full">
            <div className="space-y-1 pr-1">
              <Label_Shadcn_
                htmlFor="branch-name"
                className="text-xs font-medium text-foreground whitespace-nowrap"
              >
                Branch name
              </Label_Shadcn_>
              <FormField_Shadcn_
                control={form.control}
                name="name"
                render={({ field }) => (
                  <Input_Shadcn_
                    id="name"
                    placeholder="main"
                    className="w-full h-9 text-sm"
                    {...field}
                  />
                )}
              />

              <p className="text-[11px] leading-snug text-foreground-muted">
                This branch will be created with the settings below.
              </p>
            </div>
            <div className="space-y-1 pl-1">
              <FormField_Shadcn_
                control={form.control}
                name="environmentType"
                render={({ field }) => (
                  <>
                    <Label_Shadcn_
                      htmlFor="environment-type"
                      className="text-xs font-medium text-foreground whitespace-nowrap"
                    >
                      Environment type
                    </Label_Shadcn_>
                    <Select_Shadcn_
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger_Shadcn_ id="environment-type" className="w-full h-9 text-sm">
                        <SelectValue_Shadcn_ placeholder="Select an environment" />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {environments.map((option) => (
                          <SelectItem_Shadcn_ key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </>
                )}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 w-full">
            <div className="space-y-1 pr-1">
              <FormField_Shadcn_
                control={form.control}
                name="postgresVersion"
                render={({ field }) => {
                  const availableVersions = availablePostgresVersions || []
                  const defaultVersion =
                    availableVersions.find((version) => version.default)?.value || ''
                  return (
                    <div className="space-y-1">
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
            <div className="space-y-1 pl-1">
              <FormField_Shadcn_
                control={form.control}
                name="databasePassword"
                render={({ field }) => {
                  const hasSpecialCharacters =
                    field.value.length > 0 && !field.value.match(SPECIAL_CHARS_REGEX)

                  return (
                    <>
                      <Label_Shadcn_
                        htmlFor="branch-password"
                        className="text-xs font-medium text-foreground whitespace-nowrap"
                      >
                        Postgres password
                      </Label_Shadcn_>

                      <div className="relative">
                        <Input_Shadcn_
                          id="branch-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Give a strong password"
                          className="h-9 pr-10 text-sm"
                          {...field}
                          onChange={async (event) => {
                            field.onChange(event)
                            form.trigger('databasePasswordStrength')
                            const value = event.target.value
                            if (value === '') {
                              await form.setValue('databasePasswordStrength', 0)
                              await form.trigger('databasePassword')
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

                        <p className="text-[11px] leading-snug text-foreground-muted">
                          <PasswordStrengthBar
                            generateStrongPassword={generatePassword}
                            passwordStrengthScore={form.getValues('databasePasswordStrength')}
                            password={field.value}
                            passwordStrengthMessage={passwordStrengthMessage}
                          />
                        </p>
                      </div>
                    </>
                  )
                }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 w-full">
            <section className="rounded-lg border p-5 space-y-6">
              <div className="space-y-3">
                <p className="font-medium text-sm text-foreground">Availability &amp; storage</p>
                <div className="grid grid-cols-2">
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 text-sm">
                      <FormField_Shadcn_
                        control={form.control}
                        name="enableStorageService"
                        render={({ field }) => (
                          <>
                            <Checkbox_Shadcn_
                              id="enable-storage-service"
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                            <Label_Shadcn_
                              htmlFor="enable-storage-service"
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
                        name="enableHighAvailability"
                        render={({ field }) => (
                          <>
                            <Checkbox_Shadcn_
                              id="enable-high-availability"
                              checked={field.value}
                              onCheckedChange={(checked) => field.onChange(checked === true)}
                            />
                            <Label_Shadcn_
                              htmlFor="enable-high-availability"
                              className="text-foreground text-xs font-medium leading-tight whitespace-nowrap"
                            >
                              Enable high availability
                            </Label_Shadcn_>
                          </>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex items-start text-sm">
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
                          <p className="text-[11px] leading-snug text-foreground-muted">
                            Coming soon
                          </p>
                        </div>
                      )}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="mt-4 grid grid-cols-1 w-full">
            <div className="rounded-lg border p-5 space-y-4">
              <p className="font-medium text-sm text-foreground">Configure your branch resources</p>

              <div className="grid grid-cols-1 gap-y-4">
                {(Object.keys(limits) as ResourceType[]).map((key) => {
                  const { label, min, max, step, unit } = limits[key]
                  const value = form.watch(`resources.${key}`)
                  const enableStorageService = form.watch('enableStorageService')
                  const enabled = key !== 'storage_size' || enableStorageService
                  if (key === 'storage_size' && !enableStorageService && value > 0) {
                    form.setValue('resources.storage_size', 0)
                  }

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
                        disabled={!enabled}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Panel.Content>
      </Panel>

      <ConfirmationModal
        size="large"
        loading={false}
        visible={isOrgCreationConfirmationModalVisible}
        title={<>Confirm organization creation</>}
        confirmLabel="Create new organization"
        onCancel={() => setIsOrgCreationConfirmationModalVisible(false)}
        onConfirm={async () => {
          await onSubmit(form.getValues())
          setIsOrgCreationConfirmationModalVisible(false)
        }}
        variant={'warning'}
      ></ConfirmationModal>
    </form>
  )
}

export default NewBranchForm
