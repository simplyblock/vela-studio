import {
  RadioGroup_Shadcn_ as RadioGroup,
  RadioGroupItem_Shadcn_ as RadioGroupItem,
  cn,
} from 'ui'

import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import type { ExportFormat, ExportOption } from './types'

interface ExportModalProps {
  visible: boolean
  format: ExportFormat
  options: ExportOption[]
  onFormatChange: (format: ExportFormat) => void
  onCancel: () => void
  onConfirm: () => void
}

const ExportModal = ({
  visible,
  format,
  options,
  onFormatChange,
  onCancel,
  onConfirm,
}: ExportModalProps) => {
  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Export metering data"
      confirmLabel="Export"
      description="Choose a format to export detailed metering data for the selected billing cycle."
    >
      <RadioGroup value={format} onValueChange={(value) => onFormatChange(value as ExportFormat)} className="gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`export-${option.value}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border border-border px-3 py-2 transition-colors',
              format === option.value && 'border-foreground bg-selection'
            )}
          >
            <RadioGroupItem id={`export-${option.value}`} value={option.value} className="mt-1" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-foreground-light">{option.description}</span>
            </div>
          </label>
        ))}
      </RadioGroup>
    </ConfirmationModal>
  )
}

export default ExportModal
