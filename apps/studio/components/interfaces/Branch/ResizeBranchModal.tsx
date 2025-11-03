import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
} from 'ui'

import { useBranchEffectiveLimitsQuery } from 'data/resources/branch-effective-limits-query'
import { useBranchResizeMutation } from 'data/branches/branch-resize-mutation'

type SliderKey = 'vcpu' | 'ram' | 'nvme' | 'iops' | 'storage' | 'storageCapacity'
type ResizeState = Record<SliderKey, number>

const GiB = 1024 ** 3

const SLIDER_CONFIG: Record<
  SliderKey,
  { label: string; min: number; max: number; step: number; unit: string; defaultValue: number }
> = {
  vcpu: { label: 'vCPU', min: 1, max: 32, step: 1, unit: 'vCPU', defaultValue: 4 },
  ram: { label: 'RAM', min: 4, max: 128, step: 2, unit: 'GB', defaultValue: 16 },
  nvme: { label: 'NVMe', min: 50, max: 1000, step: 10, unit: 'GB', defaultValue: 200 },
  iops: { label: 'IOPS', min: 2000, max: 25000, step: 1000, unit: 'IOPS', defaultValue: 6000 },
  storage: { label: 'Database storage', min: 100, max: 2048, step: 50, unit: 'GB', defaultValue: 400 },
  storageCapacity: { label: 'Storage capacity', min: 100, max: 4096, step: 50, unit: 'GB', defaultValue: 800 },
}

const createInitialState = (): ResizeState => {
  return (Object.keys(SLIDER_CONFIG) as SliderKey[]).reduce((acc, key) => {
    acc[key] = SLIDER_CONFIG[key].defaultValue
    return acc
  }, {} as ResizeState)
}

// Heuristic helpers for conversions
const toGB = (val?: number | null) => {
  if (val == null) return undefined
  // If value looks like bytes (≥ 1 GiB), convert to GB. Otherwise assume already GB.
  return val >= GiB ? Math.round(val / GiB) : Math.round(val)
}
const toBytes = (gb: number) => Math.round(gb * GiB)

const toVcpu = (milli?: number | null) => {
  if (milli == null) return undefined
  return Math.max(1, Math.round(milli / 1000))
}
const toMilliVcpu = (vcpu: number) => Math.round(vcpu * 1000)

export const ResizeBranchModal = ({
  orgSlug,
  projectRef,
  branchId,
  triggerClassName,
}: {
  orgSlug: string
  projectRef: string
  branchId: string
  triggerClassName?: string
}) => {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ResizeState>(() => createInitialState())

  // Load current effective limits/resources when modal opens
  const { data: current, isFetching } = useBranchEffectiveLimitsQuery(
    { orgSlug, projectRef, branchId },
    { enabled: open }
  )

  // Populate sliders from API values (safe conversions)
  useEffect(() => {
    if (!open) return
    if (!current) return

    const next: Partial<ResizeState> = {}

    const vcpu = toVcpu(current.milli_vcpu)
    if (vcpu !== undefined) next.vcpu = clampToRange('vcpu', vcpu)

    const ramGB = toGB(current.ram)
    if (ramGB !== undefined) next.ram = clampToRange('ram', ramGB)

    const iops = current.iops ?? undefined
    if (iops !== undefined) next.iops = clampToRange('iops', iops)

    const dbGB = toGB(current.database_size)
    if (dbGB !== undefined) next.nvme = clampToRange('nvme', dbGB)

    const storageGB = toGB(current.storage_size)
    if (storageGB !== undefined) next.storageCapacity = clampToRange('storageCapacity', storageGB)

    // If API doesn't return some values, keep defaults
    setState((prev) => ({ ...prev, ...next }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, current])

  const handleOpenChange = (value: boolean) => {
    if (value) {
      // reset to defaults first; they'll get overwritten by query results above
      setState(createInitialState())
    }
    setOpen(value)
  }

  const clampToRange = useCallback((key: SliderKey, val: number) => {
    const { min, max } = SLIDER_CONFIG[key]
    return Math.min(max, Math.max(min, val))
  }, [])

  const handleSliderChange = useCallback(
    (key: SliderKey) => (values: number[]) => {
      const [nextRaw] = values
      const next = nextRaw ?? SLIDER_CONFIG[key].min
      setState((prev) => ({ ...prev, [key]: clampToRange(key, next) }))
    },
    [clampToRange]
  )

  // Mutation: resize
  const resize = useBranchResizeMutation({
    onSuccess: () => setOpen(false),
  })

  const pending = resize.isLoading || isFetching

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Convert back to API units
    const params = {
      milli_vcpu: toMilliVcpu(state.vcpu),
      ram: toBytes(state.ram),
      iops: state.iops,
      database_size: toBytes(state.nvme),
      storage_size: toBytes(state.storageCapacity),
    }

    resize.mutate({
      orgSlug,
      projectRef,
      branch: branchId, // NOTE: your pause/resume/delete expect branch name; resize here expects path {branch}. Ensure backend accepts id or change accordingly.
      parameters: params as any, // matches components['schemas']['ResizeParameters']
    })
  }

  // Render slider rows (reusable)
  const SliderRow = useCallback(
    ({ k }: { k: SliderKey }) => {
      const { label, min, max, step, unit } = SLIDER_CONFIG[k]
      const value = state[k]
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <Label_Shadcn_ htmlFor={`resize-${k}`}>{label}</Label_Shadcn_>
            <span className="text-foreground-muted">
              {value} {unit}
            </span>
          </div>
          <Slider_Shadcn_
            id={`resize-${k}`}
            value={[value]}
            min={min}
            max={max}
            step={step}
            onValueChange={handleSliderChange(k)}
            disabled={pending}
          />
        </div>
      )
    },
    [handleSliderChange, pending, state]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="default" className={triggerClassName}>
          Resize branch
        </Button>
      </DialogTrigger>

      <DialogContent size="xxlarge" className="max-h-[85vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Resize branch</DialogTitle>
          </DialogHeader>

          <DialogSection padding="medium" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">DB resize</p>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* vCPU, RAM, NVMe, IOPS, Database storage */}
                  <SliderRow k="vcpu" />
                  <SliderRow k="ram" />
                  <SliderRow k="nvme" />
                  <SliderRow k="iops" />
                  <SliderRow k="storage" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Storage resize</p>
                <div className="space-y-2">
                  <SliderRow k="storageCapacity" />
                </div>
              </div>
            </div>
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={pending} disabled={pending}>
              Apply changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ResizeBranchModal
