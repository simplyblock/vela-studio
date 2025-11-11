import { UseFormReturn } from 'react-hook-form'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GB } from 'lib/constants'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { calculateDiskSizePrice } from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { DiskType, PLAN_DETAILS } from '../ui/DiskManagement.constants'
import { DiskManagementDiskSizeReadReplicas } from '../ui/DiskManagementReadReplicas'
import DiskSpaceBar from '../ui/DiskSpaceBar'
import { DiskTypeRecommendationSection } from '../ui/DiskTypeRecommendationSection'
import FormMessage from '../ui/FormMessage'
import { InputPostTab } from '../ui/InputPostTab'
import { InputResetButton } from '../ui/InputResetButton'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

type DiskSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disableInput: boolean
  setAdvancedSettingsOpenState: (state: boolean) => void
}

export function DiskSizeField({
  form,
  disableInput,
  setAdvancedSettingsOpenState,
}: DiskSizeFieldProps) {
  const { control, formState, setValue, trigger, getValues, resetField, watch } = form
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  // coming up typically takes 5 minutes, and the request is cached for 5 mins
  // so doing less than 10 mins to account for both
  const isProjectNew = project?.status === 'STARTING'

  const watchedStorageType = watch('storageType')
  const watchedTotalSize = watch('totalSize')

  const planId = 'free'

  const { includedDiskGB: includedDiskGBMeta } =
    PLAN_DETAILS?.[planId as keyof typeof PLAN_DETAILS] ?? {}
  const includedDiskGB = includedDiskGBMeta[watchedStorageType]

  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: formState.defaultValues?.totalSize || 0,
    oldStorageType: formState.defaultValues?.storageType as DiskType,
    newSize: getValues('totalSize'),
    newStorageType: getValues('storageType') as DiskType,
  })

  const isAllocatedStorageDirty = !!formState.dirtyFields.totalSize
  const mainDiskUsed = Math.round(((branch?.used_resources.nvme_bytes ?? 0) / GB) * 100) / 100

  return (
    <div className="grid @xl:grid-cols-12 gap-5">
      <div className="col-span-4">
        <FormField_Shadcn_
          name="totalSize"
          control={control}
          render={({ field }) => (
            <FormItemLayout label="Disk Size" layout="vertical" id={field.name}>
              <div className="relative flex gap-2 items-center">
                <InputPostTab label="GB">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_
                      type="number"
                      id={field.name}
                      {...field}
                      disabled={disableInput}
                      className="w-32 font-mono rounded-r-none"
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => {
                        setValue('totalSize', e.target.valueAsNumber, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                        trigger('provisionedIOPS')
                        trigger('throughput')
                      }}
                      min={includedDiskGB}
                    />
                  </FormControl_Shadcn_>
                </InputPostTab>
                <InputResetButton
                  isDirty={isAllocatedStorageDirty}
                  onClick={() => {
                    resetField('totalSize')
                    trigger('provisionedIOPS')
                  }}
                />
              </div>
            </FormItemLayout>
          )}
        />
        <div className="flex flex-col gap-1">
          <BillingChangeBadge
            className="mt-1"
            beforePrice={Number(diskSizePrice.oldPrice)}
            afterPrice={Number(diskSizePrice.newPrice)}
            show={
              formState.isDirty &&
              !formState.errors.totalSize &&
              diskSizePrice.oldPrice !== diskSizePrice.newPrice
            }
          />
          <span className="text-foreground-lighter text-sm">
            {includedDiskGB > 0 &&
              `Your plan includes ${includedDiskGB} GB of disk size for ${watchedStorageType}.`}
          </span>
          <DiskTypeRecommendationSection
            form={form}
            actions={
              <Button
                type="default"
                onClick={() => {
                  setValue('storageType', 'io2')
                  trigger('provisionedIOPS')
                  trigger('totalSize')
                  setAdvancedSettingsOpenState(true)
                }}
              >
                Change to High Performance SSD
              </Button>
            }
          />
        </div>
      </div>
      <div className="col-span-8">
        <DiskSpaceBar form={form} />

        {isProjectNew && (
          <FormMessage
            message="Disk size data is not available for ~10 minutes after project creation"
            type="error"
          />
        )}

        <DiskManagementDiskSizeReadReplicas
          isDirty={formState.dirtyFields.totalSize !== undefined}
          totalSize={(formState.defaultValues?.totalSize || 0) * 1.25}
          usedSize={mainDiskUsed}
          newTotalSize={watchedTotalSize * 1.25}
          oldStorageType={formState.defaultValues?.storageType as DiskType}
          newStorageType={getValues('storageType') as DiskType}
        />
      </div>
    </div>
  )
}
