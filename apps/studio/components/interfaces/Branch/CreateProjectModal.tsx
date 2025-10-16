import { Eye, EyeOff } from 'lucide-react'
import { ChangeEvent, FormEvent, useCallback, useState } from 'react'
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
  Input_Shadcn_,
  Label_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  Select_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Slider_Shadcn_,
  Checkbox_Shadcn_,
} from 'ui'
import { generateStrongPassword } from 'lib/project'

type SliderKey = 'vcpu' | 'ram' | 'nvme' | 'iops' | 'storage'

type FormState = {
  projectName: string
  branchName: string
  password: string
  confirmPassword: string
  environmentType: string
  vcpu: number
  ram: number
  nvme: number
  iops: number
  storage: number
  includeFileStorage: boolean
  enableHa: boolean
  readReplicas: number
}

const ENVIRONMENT_OPTIONS = [
  { label: 'Development', value: 'development' },
  { label: 'Test', value: 'test' },
  { label: 'Production', value: 'production' },
]

const SLIDER_CONFIG: Record<
  SliderKey,
  { label: string; min: number; max: number; step: number; unit: string }
> = {
  vcpu: { label: 'vCPU', min: 1, max: 32, step: 1, unit: 'vCPU' },
  ram: { label: 'RAM', min: 1, max: 128, step: 1, unit: 'GB' },
  nvme: { label: 'NVMe', min: 10, max: 1000, step: 10, unit: 'GB' },
  iops: { label: 'IOPS', min: 1000, max: 20000, step: 500, unit: 'IOPS' },
  storage: { label: 'Storage', min: 50, max: 2000, step: 50, unit: 'GB' },
}

const createInitialFormState = (): FormState => ({
  projectName: '',
  branchName: '',
  password: '',
  confirmPassword: '',
  environmentType: ENVIRONMENT_OPTIONS[0]?.value ?? 'development',
  vcpu: 2,
  ram: 8,
  nvme: 100,
  iops: 3000,
  storage: 200,
  includeFileStorage: false,
  enableHa: false,
  readReplicas: 0,
})

const CreateProjectModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(() => createInitialFormState())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const resetState = useCallback(() => {
    setFormState(createInitialFormState())
    setShowPassword(false)
    setShowConfirmPassword(false)
  }, [])

  const updateField = useCallback<<K extends keyof FormState>(key: K, value: FormState[K]) => void>(
    (key, value) => {
      setFormState((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSliderChange = useCallback(
    (key: SliderKey) => (value: number[]) => {
      const [next] = value
      updateField(key, (next ?? SLIDER_CONFIG[key].min) as FormState[SliderKey])
    },
    [updateField]
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsOpen(false)
    // TODO: hook into API: createProject(formState)
  }

  const handleGeneratePassword = useCallback(() => {
    const password = generateStrongPassword()
    setFormState((prev) => ({ ...prev, password, confirmPassword: password }))
  }, [])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      resetState()
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="primary">Create project</Button>
      </DialogTrigger>
      <DialogContent size="xxlarge" className="max-h-[85vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>

          <DialogSection padding="medium" className="space-y-6">
            {/* Project + Branch names */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="project-name">Project name</Label_Shadcn_>
                <Input_Shadcn_
                  id="project-name"
                  placeholder="give-your-project-a-name"
                  value={formState.projectName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('projectName', e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="branch-name">Branch name</Label_Shadcn_>
                <Input_Shadcn_
                  id="branch-name"
                  placeholder="main"
                  value={formState.branchName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateField('branchName', e.target.value)
                  }
                />
              </div>
            </div>

            {/* Environment type */}
            <div className="space-y-2">
              <Label_Shadcn_ htmlFor="environment-type">Environment type</Label_Shadcn_>
              <Select_Shadcn_
                value={formState.environmentType}
                onValueChange={(value) => updateField('environmentType', value)}
              >
                <SelectTrigger_Shadcn_ id="environment-type">
                  <SelectValue_Shadcn_ placeholder="Select an environment" />
                </SelectTrigger_Shadcn_>
                <SelectContent_Shadcn_>
                  {ENVIRONMENT_OPTIONS.map((option) => (
                    <SelectItem_Shadcn_ key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem_Shadcn_>
                  ))}
                </SelectContent_Shadcn_>
              </Select_Shadcn_>
            </div>

            {/* Password fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="project-password">Pg master password</Label_Shadcn_>
                <div className="relative">
                  <Input_Shadcn_
                    id="project-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="give a strong password"
                    className="pr-10"
                    value={formState.password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField('password', e.target.value)
                    }
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
              </div>
              <div className="space-y-2">
                <Label_Shadcn_ htmlFor="project-password-confirm">Confirm password</Label_Shadcn_>
                <div className="relative">
                  <Input_Shadcn_
                    id="project-password-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Repeat the password"
                    className="pr-10"
                    value={formState.confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      updateField('confirmPassword', e.target.value)
                    }
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
              <div className="md:col-span-2">
                <Button type="default" size="tiny" htmlType="button" onClick={handleGeneratePassword}>
                  Generate strong password
                </Button>
              </div>
            </div>

            {/* Sizing sliders */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Sizing</p>
              <div className="grid gap-6 md:grid-cols-2">
                {(Object.keys(SLIDER_CONFIG) as SliderKey[]).map((key) => {
                  const { label, min, max, step, unit } = SLIDER_CONFIG[key]
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <Label_Shadcn_ htmlFor={`sizing-${key}`} className="text-foreground">
                          {label}
                        </Label_Shadcn_>
                        <span className="text-foreground-muted">
                          {formState[key]} {unit}
                        </span>
                      </div>
                      <Slider_Shadcn_
                        id={`sizing-${key}`}
                        min={min}
                        max={max}
                        step={step}
                        value={[formState[key]]}
                        onValueChange={handleSliderChange(key)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Storage + HA */}
            <div className="flex items-start gap-3">
              <Checkbox_Shadcn_
                id="include-file-storage"
                checked={formState.includeFileStorage}
                onCheckedChange={(checked) =>
                  updateField('includeFileStorage', checked === true)
                }
              />
              <Label_Shadcn_ htmlFor="include-file-storage" className="text-sm">
                Include file storage
              </Label_Shadcn_>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">HA &amp; scalability</p>
              <div className="flex items-start gap-3">
                <Checkbox_Shadcn_
                  id="enable-ha"
                  checked={formState.enableHa}
                  onCheckedChange={(checked) => updateField('enableHa', checked === true)}
                />
                <Label_Shadcn_ htmlFor="enable-ha" className="text-sm">
                  Enable high availability
                </Label_Shadcn_>
              </div>
              <div className="space-y-1">
                <Label_Shadcn_ htmlFor="read-replicas">Read replicas</Label_Shadcn_>
                <Input_Shadcn_
                  id="read-replicas"
                  type="number"
                  value={formState.readReplicas}
                  disabled
                  readOnly
                />
                <p className="text-xs text-foreground-muted">Coming soon</p>
              </div>
            </div>
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button htmlType="submit" type="primary">
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProjectModal
