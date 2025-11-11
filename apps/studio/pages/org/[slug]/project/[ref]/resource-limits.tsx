import { useEffect, useMemo } from 'react'
import { useController, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { NextPageWithLayout } from 'types'
import {
  Button,
  Label_Shadcn_,
  Slider_Shadcn_,
  Form_Shadcn_,
  FormField_Shadcn_,
  cn,
  Card,
} from 'ui'

import { useParams } from 'common'
import { useProjectLimitsQuery } from 'data/resources/project-limits-query'
import { useResourceLimitDefinitionsQuery } from 'data/resource-limits/resource-limit-definitions-query'
import { useProjectLimitUpdateMutation } from 'data/resources/project-limit-update-mutation'
import { useProjectUsageQuery } from 'data/resources/project-usage-query'

/* ──────────────────────────────────────────────────────────────────
   Types & mapping
------------------------------------------------------------------- */

type ResourceType = 'ram' | 'iops' | 'milli_vcpu' | 'storage_size' | 'database_size'
type SliderKey = 'vcpu' | 'ram' | 'nvme' | 'iops' | 'storage'
type FormValues = { perBranch: Record<SliderKey, number>; project: Record<SliderKey, number> }

const SLIDER_KEYS: SliderKey[] = ['vcpu', 'ram', 'nvme', 'iops', 'storage']

const LABELS: Record<SliderKey, string> = {
  vcpu: 'vCPU',
  ram: 'RAM',
  nvme: 'Database storage',
  iops: 'IOPS',
  storage: 'Storage',
}

const RESOURCE_TYPE_TO_KEY: Record<ResourceType, SliderKey> = {
  milli_vcpu: 'vcpu',
  ram: 'ram',
  iops: 'iops',
  storage_size: 'storage',
  database_size: 'nvme',
}
const KEY_TO_RESOURCE_TYPE: Record<SliderKey, ResourceType> = {
  vcpu: 'milli_vcpu',
  ram: 'ram',
  nvme: 'database_size',
  iops: 'iops',
  storage: 'storage_size',
}

type LimitCfg = {
  label: string
  min: number
  max: number
  step: number
  unit: string
  divider: number
}

/* ──────────────────────────────────────────────────────────────────
   Memoized SliderField
   - Local "live" state via RHF useController (no parent re-renders per tick)
   - Commit to form on onValueCommit only
------------------------------------------------------------------- */

const SliderField = ({
  name,
  label,
  unit,
  min,
  max,
  step,
  usage,
  current,
  onCommit,
}: {
  name: `perBranch.${SliderKey}` | `project.${SliderKey}`
  label: string
  unit: string
  min: number
  max: number
  step: number
  usage: number
  current: number
  onCommit: (next: number) => void
}) => {
  const { field } = useController({ name })
  const value = field.value as number

  const usagePct = value > 0 ? (usage / value) * 100 : 0
  const nearLimit = usagePct > 90

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between">
        <Label_Shadcn_ htmlFor={name} className="text-xs font-medium text-foreground">
          {label}
        </Label_Shadcn_>
        <div className="text-right">
          <div
            className={cn(
              'text-[11px] font-mono',
              nearLimit ? 'text-destructive' : 'text-foreground-muted'
            )}
          >
            Usage:{' '}
            <span className="inline-block w-16 text-right">
              {Math.round(usage)}
            </span>{' '}
            {unit}
          </div>
          <div className="text-[11px] text-foreground-muted font-mono">
            Current:{' '}
            <span className="inline-block w-16 text-right">
              {Math.round(current)}
            </span>{' '}
            {unit}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Slider_Shadcn_
          id={name}
          min={min}
          max={max}
          step={step}
          value={[value]}
          onValueChange={(v) => {
            // Smooth UI drag without form-wide re-renders:
            // We keep UI responsive but do NOT cross-sync here.
            // If your slider lacks onValueCommit, you can still set field.onChange(v[0])
            // but wrap it in requestAnimationFrame to throttle.
            field.onChange(v[0])
          }}
          onValueCommit={(v) => {
            const next = v[0]
            onCommit(next)
          }}
        />
        <div className="w-20 text-right text-[11px] text-foreground-muted font-mono">
          {Math.round(value)} {unit}
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Page
------------------------------------------------------------------- */

const ResourceLimit: NextPageWithLayout = () => {
  const { slug: orgRef, ref: projectRef } = useParams() as { slug?: string; ref?: string }

  const { data: limitsData } = useProjectLimitsQuery({ orgRef, projectRef })
  const { data: definitions } = useResourceLimitDefinitionsQuery()
  const { data: usageData } = useProjectUsageQuery({ orgRef, projectRef })
  
 
  const { mutateAsync: updateLimit, isLoading: isSaving } = useProjectLimitUpdateMutation()

  // Build dynamic cfg (normalize with divider = step)
 const limitConfig: Record<SliderKey, LimitCfg> | null = useMemo(() => {
  if (!definitions) return null

  const map = {} as Record<SliderKey, LimitCfg>

  definitions.forEach((def) => {
    const rt = def.resource_type as ResourceType
    const k = RESOURCE_TYPE_TO_KEY[rt]
    if (!k) return

    switch (rt) {
      case 'milli_vcpu': {
        const divider = 1000 // millis → vCPU
        map[k] = {
          label: LABELS[k],
          min: (def.min ?? 0) / divider,
          max: (def.max ?? 0) / divider,
          step: 0.1, // 0.1 vCPU increments
          unit: 'vCPU',
          divider,
        }
        break
      }
      case 'ram': {
        const GIB = 1024 * 1024 * 1024
        const divider = GIB // bytes → GiB
        map[k] = {
          label: LABELS[k],
          min: (def.min ?? 0) / divider,
          max: (def.max ?? 0) / divider,
          step: 0.125, // 128 MiB
          unit: 'GiB',
          divider,
        }
        break
      }
      case 'iops': {
        const divider = 1
        map[k] = {
          label: LABELS[k],
          min: def.min ?? 0,
          max: def.max ?? 0,
          step: Math.max(1, def.step ?? 100),
          unit: 'IOPS',
          divider,
        }
        break
      }
      case 'database_size':
      case 'storage_size': {
        const divider = 10_000_000_00 // 10 GB chunks from API
        map[k] = {
          label: LABELS[k],
          min: (def.min ?? 0) / divider,
          max: (def.max ?? 0) / divider,
          step: 1, // 10 GB per tick
          unit: 'GB',
          divider,
        }
        break
      }
    }
  })

  // Ensure all keys exist even if a definition is missing
  SLIDER_KEYS.forEach((k) => {
    if (!map[k]) {
      map[k] = {
        label: LABELS[k],
        min: 0,
        max: 0,
        step: 1,
        unit: k === 'iops' ? 'IOPS' : k === 'ram' ? 'GiB' : k === 'vcpu' ? 'vCPU' : 'GB',
        divider: 1,
      }
    }
  })

  return map
}, [definitions])


  // Normalize usage -> UI units
  const usageByKey = useMemo(() => {
    const base: Partial<Record<SliderKey, number>> = {}
    if (!usageData || !limitConfig) return base
    if (usageData.milli_vcpu != null) base.vcpu = usageData.milli_vcpu / limitConfig.vcpu.divider
    if (usageData.ram != null) base.ram = usageData.ram / limitConfig.ram.divider
    if (usageData.iops != null) base.iops = usageData.iops / limitConfig.iops.divider
    if (usageData.storage_size != null) base.storage = usageData.storage_size / limitConfig.storage.divider
    if (usageData.database_size != null) base.nvme = usageData.database_size / limitConfig.nvme.divider
    return base
  }, [usageData, limitConfig])

  // Compose defaults from current configured limits
  const defaults: FormValues | null = useMemo(() => {
    if (!limitsData || !limitConfig) return null
    const perBranch = { vcpu: 0, ram: 0, iops: 0, storage: 0, nvme: 0 }
    const project = { vcpu: 0, ram: 0, iops: 0, storage: 0, nvme: 0 }

    for (const lim of limitsData) {
      const key = RESOURCE_TYPE_TO_KEY[lim.resource as ResourceType]
      if (!key) continue
      const div = limitConfig[key].divider || 1
      perBranch[key] = (lim.max_per_branch ?? 0) / div
      project[key] = (lim.max_total ?? 0) / div
    }

    // Ensure starting values respect usage and invariants
    SLIDER_KEYS.forEach((k) => {
      const usage = usageByKey[k] ?? 0
      const min = limitConfig[k].min
      perBranch[k] = Math.max(perBranch[k], usage, min)
      project[k] = Math.max(project[k], perBranch[k], usage, min)
    })

    return { perBranch, project }
  }, [limitsData, limitConfig, usageByKey])

  const form = useForm<FormValues>({
    mode: 'onChange',
    defaultValues:
      defaults ?? { perBranch: { vcpu: 0, ram: 0, iops: 0, nvme: 0, storage: 0 }, project: { vcpu: 0, ram: 0, iops: 0, nvme: 0, storage: 0 } },
  })

  // Keep form in sync if defaults change
  useEffect(() => {
    if (defaults) form.reset(defaults)
  }, [defaults, form])

  const perBranch = useWatch({ control: form.control, name: 'perBranch' })
  const project = useWatch({ control: form.control, name: 'project' })

  // Commit handlers (only run when the user releases the slider)
  const commitPerBranch = (key: SliderKey) => (next: number) => {
    if (!limitConfig) return
    const usage = usageByKey[key] ?? 0
    const cfg = limitConfig[key]
    const clamped = Math.min(Math.max(next, Math.max(cfg.min, usage)), cfg.max)
    form.setValue(`perBranch.${key}`, clamped, { shouldDirty: true, shouldValidate: false })

    // Raise project side if needed (no auto-lowering)
    const projVal = form.getValues(`project.${key}`)
    if (clamped > projVal) {
      form.setValue(`project.${key}`, clamped, { shouldDirty: true, shouldValidate: false })
    }
  }

  const commitProject = (key: SliderKey) => (next: number) => {
    if (!limitConfig) return
    const usage = usageByKey[key] ?? 0
    const cfg = limitConfig[key]
    const branchVal = form.getValues(`perBranch.${key}`)
    const lowerBound = Math.max(cfg.min, usage, branchVal)
    const clamped = Math.min(Math.max(next, lowerBound), cfg.max)
    form.setValue(`project.${key}`, clamped, { shouldDirty: true, shouldValidate: false })
  }

  const handleSave = async () => {
    if (!orgRef || !projectRef) {
      toast.error('Missing organization or project reference')
      return
    }
    if (!limitConfig || !defaults) {
      toast.error('Limits not loaded yet')
      return
    }

    const values = form.getValues()
    const changed = SLIDER_KEYS.filter(
      (k) =>
        values.perBranch[k] !== defaults.perBranch[k] ||
        values.project[k] !== defaults.project[k]
    )

    if (changed.length === 0) {
      toast.info('No changes to save')
      return
    }

    try {
      for (const k of changed) {
        const divider = limitConfig[k].divider || 1
        const usage = usageByKey[k] ?? 0

        if (values.perBranch[k] < usage || values.project[k] < usage) {
          toast.error(
            `Cannot set ${LABELS[k]} below current usage (${Math.round(usage)} ${limitConfig[k].unit})`
          )
          continue
        }

        await updateLimit({
          orgRef,
          projectRef,
          limit: {
            resource: KEY_TO_RESOURCE_TYPE[k],
            max_per_branch: Math.round(values.perBranch[k] * divider),
            max_total: Math.round(values.project[k] * divider),
          },
        })
      }

      toast.success('Limits updated')
      form.reset(values)
    } catch (e) {
      console.error(e)
      toast.error('Failed to update limits')
    }
  }

  const loading = !limitConfig || !defaults

  return (
    <Form_Shadcn_ {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="flex flex-col gap-8 px-8 py-8 max-w-[1200px] mx-auto"
      >
        <header>
          <h1 className="text-xl font-semibold">Resource limits</h1>
          <p className="text-sm text-foreground-muted">
            Adjust per-branch and project ceilings. We only raise the lower side to maintain consistency while you drag.
          </p>
        </header>

        <div className="grid gap-8 xl:grid-cols-2">
          {/* Per-branch */}
          <Card className="p-5 space-y-4">
            <p className="font-medium text-sm text-foreground">Sizing (per branch)</p>

            {loading ? (
              <p className="text-sm text-foreground-muted">Loading limits…</p>
            ) : (
              SLIDER_KEYS.map((k) => {
                const cfg = limitConfig[k]
                const usage = usageByKey[k] ?? 0
                return (
                  <FormField_Shadcn_
                    key={`per-${k}`}
                    control={form.control}
                    name={`perBranch.${k}`}
                    render={() => (
                      <SliderField
                        name={`perBranch.${k}`}
                        label={cfg.label}
                        unit={cfg.unit}
                        // Static bounds – we clamp on commit to avoid thumb jumps.
                        min={cfg.min}
                        max={cfg.max}
                        step={cfg.step}
                        usage={usage}
                        current={defaults!.perBranch[k]}
                        onCommit={commitPerBranch(k)}
                      />
                    )}
                  />
                )
              })
            )}

            <p className="text-[11px] leading-snug text-foreground-muted">
              Resource allocation per branch.
            </p>
          </Card>

          {/* Project limits */}
          <Card className="p-5 space-y-4">
            <p className="font-medium text-sm text-foreground">Project limits</p>

            {loading ? (
              <p className="text-sm text-foreground-muted">Loading limits…</p>
            ) : (
              SLIDER_KEYS.map((k) => {
                const cfg = limitConfig[k]
                const usage = usageByKey[k] ?? 0
                return (
                  <FormField_Shadcn_
                    key={`proj-${k}`}
                    control={form.control}
                    name={`project.${k}`}
                    render={() => (
                      <SliderField
                        name={`project.${k}`}
                        label={cfg.label}
                        unit={cfg.unit}
                        // Static bounds – we clamp on commit so project never goes below branch/usage.
                        min={cfg.min}
                        max={cfg.max}
                        step={cfg.step}
                        usage={usage}
                        current={defaults!.project[k]}
                        onCommit={commitProject(k)}
                      />
                    )}
                  />
                )
              })
            )}

            <p className="text-[11px] leading-snug text-foreground-muted">
              Global ceilings across all branches in this project.
            </p>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button type="primary" htmlType="submit" loading={isSaving}>
            Save changes
          </Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}

/* ──────────────────────────────────────────────────────────────────
   Layout wrappers
------------------------------------------------------------------- */

ResourceLimit.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ResourceLimit
