import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Label_Shadcn_,
  Slider_Shadcn_,
  Card,
} from 'ui'
import { toast } from 'sonner'

import { useBranchSliderResourceLimits, SliderSpecification, ResourceType } from 'data/resource-limits/branch-slider-resource-limits'
import { useBranchResizeMutation } from 'data/branches/branch-resize-mutation'

type BranchMaxResources = {
  milli_vcpu: number
  ram_bytes: number
  nvme_bytes: number
  iops: number
  storage_bytes?: number | null | undefined
}

type Props = {
  orgSlug: string
  projectRef: string
  branchId: string
  branchMax: BranchMaxResources
  triggerClassName?: string
}

type FormValues = {
  milli_vcpu: number
  ram: number
  database_size: number
  iops: number
  storage_size: number
}

/**
 * BranchResizeModal (uses branchMax prop)
 *
 * - slider specs from useBranchSliderResourceLimits(orgSlug, projectRef)
 * - current values read from branchMax prop (no internal effective-limits query)
 * - displays current vs new values and submits changed API params
 */
export const BranchResizeModal: React.FC<Props> = ({ orgSlug, projectRef, branchId, branchMax, triggerClassName }) => {
  const [open, setOpen] = useState(false)

  // slider specs (merged system + project limits)
  const { isLoading: specsLoading, data: specs } = useBranchSliderResourceLimits(undefined, orgSlug, projectRef)

  const resize = useBranchResizeMutation({
    onSuccess: () => {
      setOpen(false)
    },
  })

  const loading = specsLoading || resize.isLoading

  // react-hook-form
  const { register, setValue, watch, reset } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      milli_vcpu: 0,
      ram: 0,
      database_size: 0,
      iops: 0,
      storage_size: 0,
    },
  })

  // convenience typed view of specs
  const sliderSpecs: Partial<Record<ResourceType, SliderSpecification>> = useMemo(() => {
    if (!specs) return {}
    return {
      milli_vcpu: specs.milli_vcpu,
      ram: specs.ram,
      iops: specs.iops,
      database_size: specs.database_size,
      storage_size: specs.storage_size,
    }
  }, [specs])

  // helper: convert API value (branchMax) -> display value using spec.divider
  const apiToDisplay = (rk: ResourceType, apiVal?: number | null) => {
    const s = sliderSpecs[rk]
    if (!s || apiVal == null) return undefined
    // round/display as integer (UI shows integers for these specs)
    return Math.round(apiVal / s.divider)
  }

  // initialize form values when modal opens (use branchMax when available, else spec.initial / min)
  useEffect(() => {
    if (!open) return
    if (!specs) return

    const initial: Partial<FormValues> = {}

    const pick = (rk: ResourceType) => {
      const s = sliderSpecs[rk]
      if (!s) return 0
      // map branchMax keys to resource types
      let apiCurrent: number | null = null
      switch (rk) {
        case 'milli_vcpu':
          apiCurrent = branchMax?.milli_vcpu ?? null
          break
        case 'ram':
          apiCurrent = branchMax?.ram_bytes ?? null
          break
        case 'iops':
          apiCurrent = branchMax?.iops ?? null
          break
        case 'database_size':
          apiCurrent = branchMax?.nvme_bytes ?? null
          break
        case 'storage_size':
          apiCurrent = branchMax?.storage_bytes ?? null
          break
      }
      if (apiCurrent != null) return Math.min(s.max, Math.max(s.min, Math.round(apiCurrent / s.divider)))
      if (typeof s.initial === 'number') return Math.min(s.max, Math.max(s.min, Math.round(s.initial)))
      return s.min
    }

    initial.milli_vcpu = pick('milli_vcpu')
    initial.ram = pick('ram')
    initial.iops = pick('iops')
    initial.database_size = pick('database_size')
    initial.storage_size = pick('storage_size')

    reset(initial as FormValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, specs, branchMax])

  // build parameters: convert display -> API units using spec.divider, compare to branchMax and include only diffs
  const buildParameters = () => {
    const values = watch()
    const params: {
      milli_vcpu?: number | null
      memory_bytes?: number | null
      iops?: number | null
      database_size?: number | null
      storage_size?: number | null
    } = {}

    const cur = branchMax 

    const diffSet = (rk: ResourceType, displayVal: number | undefined, curApi: number | null | undefined, targetKey: keyof typeof params) => {
      const s = sliderSpecs[rk]
      if (!s || displayVal == null) return
      const apiVal = Math.round(displayVal * s.divider)
      if (curApi == null || apiVal !== curApi) params[targetKey] = apiVal
    }

    diffSet('milli_vcpu', values.milli_vcpu, cur.milli_vcpu, 'milli_vcpu')
    diffSet('ram', values.ram, cur.ram_bytes, 'memory_bytes')
    diffSet('iops', values.iops, cur.iops, 'iops')
    diffSet('database_size', values.database_size, cur.nvme_bytes, 'database_size')
    diffSet('storage_size', values.storage_size, cur.storage_bytes ?? null, 'storage_size')

    return params
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!specs) {
      toast.error('Slider configuration missing')
      return
    }
    if (!orgSlug || !projectRef || !branchId) {
      toast.error('Missing references')
      return
    }

    const parameters = buildParameters()
    if (Object.keys(parameters).length === 0) {
      toast.info('No changes to apply')
      return
    }

    resize.mutate({ orgSlug, projectRef, branch: branchId, parameters: parameters as any }, {
      onError: (err: any) => toast.error(err?.message ?? 'Failed to resize branch'),
    })
  }

  // render a slider row with Current (from branchMax) and New values
  const renderSliderRow = (rk: ResourceType) => {
    const s = sliderSpecs[rk]
    if (!s) return null
    const currentDisplay = (() => {
      switch (rk) {
        case 'milli_vcpu':
          return apiToDisplay('milli_vcpu', branchMax?.milli_vcpu ?? null)
        case 'ram':
          return apiToDisplay('ram', branchMax?.ram_bytes ?? null)
        case 'iops':
          return apiToDisplay('iops', branchMax?.iops ?? null)
        case 'database_size':
          return apiToDisplay('database_size', branchMax?.nvme_bytes ?? null)
        case 'storage_size':
          return apiToDisplay('storage_size', branchMax?.storage_bytes ?? null)
        default:
          return undefined
      }
    })()

    const value = watch(rk as keyof FormValues) as number

    return (
      <div key={rk} className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <Label_Shadcn_ htmlFor={`resize-${rk}`}>{s.label ?? rk}</Label_Shadcn_>
          <div className="text-right">
            <div className="text-[11px] text-foreground-muted font-mono">
              Current: <span className="inline-block w-20 text-right">{currentDisplay ?? '—'}</span> {s.unit}
            </div>
            <div className="text-[11px] text-foreground-muted font-mono">
              New: <span className="inline-block w-20 text-right">{Math.round(value)}</span> {s.unit}
            </div>
          </div>
        </div>

        <input type="hidden" {...register(rk as keyof FormValues)} />

        <Slider_Shadcn_
          id={`resize-${rk}`}
          min={s.min}
          max={s.max}
          step={s.step}
          value={[watch(rk as keyof FormValues) as number]}
          onValueChange={(v) => {
            const [next] = v
            setValue(rk as keyof FormValues, next, { shouldDirty: true, shouldValidate: false })
          }}
          disabled={loading}
        />
      </div>
    )
  }

  const configMissing = !specs || Object.keys(specs).length === 0

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button type="default" className={triggerClassName}>
          Resize branch
        </Button>
      </DialogTrigger>

      <DialogContent size="xxlarge" className="max-h-[85vh] overflow-y-auto p-0">
        <form onSubmit={onSubmit} className="flex flex-col">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Resize branch</DialogTitle>
          </DialogHeader>

          <DialogSection padding="medium" className="space-y-6">
            {configMissing ? (
              <Card className="p-4">
                <p className="text-sm text-foreground-muted">Unable to load slider configuration. Please try again later.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Database & compute</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {renderSliderRow('milli_vcpu')}
                  {renderSliderRow('ram')}
                  {renderSliderRow('database_size')}
                  {renderSliderRow('iops')}
                  {renderSliderRow('storage_size')}
                </div>
              </div>
            )}
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} disabled={loading || configMissing}>
              Apply changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BranchResizeModal
