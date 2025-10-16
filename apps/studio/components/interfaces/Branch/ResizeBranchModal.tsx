import { FormEvent, useCallback, useState } from 'react'
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

type SliderKey = 'vcpu' | 'ram' | 'nvme' | 'iops' | 'storage' | 'storageCapacity'

type ResizeState = Record<SliderKey, number>

const SLIDER_CONFIG: Record<
  SliderKey,
  { label: string; min: number; max: number; step: number; unit: string; defaultValue: number }
> = {
  vcpu: { label: 'vCPU', min: 1, max: 32, step: 1, unit: 'vCPU', defaultValue: 4 },
  ram: { label: 'RAM', min: 4, max: 128, step: 2, unit: 'GB', defaultValue: 16 },
  nvme: { label: 'NVMe', min: 50, max: 1000, step: 10, unit: 'GB', defaultValue: 200 },
  iops: { label: 'IOPS', min: 2000, max: 25000, step: 1000, unit: 'IOPS', defaultValue: 6000 },
  storage: { label: 'Database storage', min: 100, max: 2048, step: 50, unit: 'GB', defaultValue: 400 },
  storageCapacity: {
    label: 'Storage capacity',
    min: 100,
    max: 4096,
    step: 50,
    unit: 'GB',
    defaultValue: 800,
  },
}

const createInitialState = (): ResizeState => {
  return Object.keys(SLIDER_CONFIG).reduce((acc, key) => {
    const sliderKey = key as SliderKey
    acc[sliderKey] = SLIDER_CONFIG[sliderKey].defaultValue
    return acc
  }, {} as ResizeState)
}

const ResizeBranchModal = () => {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ResizeState>(() => createInitialState())

  const handleOpenChange = (value: boolean) => {
    if (value) {
      setState(createInitialState())
    }
    setOpen(value)
  }

  const handleSliderChange = useCallback(
    (key: SliderKey) => (values: number[]) => {
      const [next] = values
      setState((prev) => ({ ...prev, [key]: next ?? SLIDER_CONFIG[key].min }))
    },
    []
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="default">Resize branch</Button>
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
                  {(Object.keys(SLIDER_CONFIG) as SliderKey[])
                    .filter((key) => key !== 'storageCapacity')
                    .map((key) => {
                      const { label, min, max, step, unit } = SLIDER_CONFIG[key]

                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <Label_Shadcn_ htmlFor={`resize-${key}`}>{label}</Label_Shadcn_>
                            <span className="text-foreground-muted">{state[key]} {unit}</span>
                          </div>
                          <Slider_Shadcn_
                            id={`resize-${key}`}
                            value={[state[key]]}
                            min={min}
                            max={max}
                            step={step}
                            onValueChange={handleSliderChange(key)}
                          />
                        </div>
                      )
                    })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Storage resize</p>
                <div className="space-y-2">
                  {(() => {
                    const key: SliderKey = 'storageCapacity'
                    const { label, min, max, step, unit } = SLIDER_CONFIG[key]
                    return (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <Label_Shadcn_ htmlFor={`resize-${key}`}>{label}</Label_Shadcn_>
                          <span className="text-foreground-muted">{state[key]} {unit}</span>
                        </div>
                        <Slider_Shadcn_
                          id={`resize-${key}`}
                          value={[state[key]]}
                          min={min}
                          max={max}
                          step={step}
                          onValueChange={handleSliderChange(key)}
                        />
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Apply changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ResizeBranchModal
