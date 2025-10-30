'use client'

import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
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
} from 'ui'


import { useParams } from 'common'
import { useProjectLimitsQuery } from 'data/resources/project-limits-query'
import { useResourceLimitDefinitionsQuery } from 'data/resource-limits/resource-limit-definitions-query'
import { useProjectLimitUpdateMutation } from 'data/resources/project-limit-update-mutation'
import { useProjectUsageQuery } from 'data/resources/project-usage-query'

/* ------------------------------------------------------------------
   Types
-------------------------------------------------------------------*/

type ResourceType =
  | 'ram'
  | 'iops'
  | 'milli_vcpu'
  | 'storage_size'
  | 'database_size'

type LimitKey = 'ram' | 'iops' | 'vcpu' | 'storage' | 'nvme'

type FormValues = Record<LimitKey, number>

/* ------------------------------------------------------------------
   Constants
-------------------------------------------------------------------*/

const RESOURCE_TYPE_TO_KEY: Record<ResourceType, LimitKey> = {
  ram: 'ram',
  iops: 'iops',
  milli_vcpu: 'vcpu',
  storage_size: 'storage',
  database_size: 'nvme',
}

const LABELS: Record<LimitKey, string> = {
  ram: 'RAM',
  iops: 'IOPS',
  vcpu: 'vCPU',
  storage: 'Storage',
  nvme: 'Database size',
}

/* ------------------------------------------------------------------
   Component
-------------------------------------------------------------------*/

const ResourceLimit: NextPageWithLayout = () => {
  const { orgSlug, ref: projectRef } = useParams()

  const { data: limitsData } = useProjectLimitsQuery({ orgRef: orgSlug, projectRef })
  const { data: definitions } = useResourceLimitDefinitionsQuery()
  const { data: usageData } = useProjectUsageQuery({ orgRef: orgSlug, projectRef })
  const { mutateAsync: updateLimit } = useProjectLimitUpdateMutation()

  // normalize usage
  const usageByKey = useMemo(() => {
    if (!usageData) return {}
    const map: Partial<Record<LimitKey, number>> = {}
    if (usageData.milli_vcpu != null) map.vcpu = usageData.milli_vcpu
    if (usageData.ram != null) map.ram = usageData.ram
    if (usageData.iops != null) map.iops = usageData.iops
    if (usageData.storage_size != null) map.storage = usageData.storage_size
    if (usageData.database_size != null) map.nvme = usageData.database_size
    return map
  }, [usageData])

  // default values from limits
  const defaultValues: FormValues = useMemo(() => {
    const base: Partial<FormValues> = {}
    if (limitsData) {
      for (const lim of limitsData) {
        const key = RESOURCE_TYPE_TO_KEY[lim.resource as ResourceType]
        if (key) base[key] = lim.max_total ?? 0
      }
    }
    return base as FormValues
  }, [limitsData])

  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
  })

  const finalLimitConfig = useMemo(() => {
    if (!definitions) return []
    // @ts-ignore
    return definitions
      .map((def) => {
        const k = RESOURCE_TYPE_TO_KEY[def.resource_type as ResourceType]
        if (!k) return null
        const usage = usageByKey[k] ?? 0
        return {
          key: k,
          label: LABELS[k],
          min: Math.max(def.min, usage),
          max: def.max,
          step: def.step,
          unit: def.unit || '',
          usage,
          value: form.watch(k),
        }
      })
      .filter(Boolean) as {
      key: LimitKey
      label: string
      min: number
      max: number
      step: number
      unit: string
      usage: number
      value: number
    }[]
  }, [definitions, usageByKey, form])

  /* ------------------------------------------------------------------
     Save handler
  -------------------------------------------------------------------*/
  const handleSave = async () => {
    if (!orgSlug || !projectRef) {
      toast.error('Missing organization or project reference')
      return
    }

    const values = form.getValues()
    const original = defaultValues
    const changedKeys = (Object.keys(values) as LimitKey[]).filter(
      (k) => values[k] !== original[k]
    )

    if (changedKeys.length === 0) {
      toast.info('No changes to save')
      return
    }

    try {
      for (const key of changedKeys) {
        const newVal = values[key]
        const usageVal = usageByKey[key] ?? 0
        if (newVal < usageVal) {
          toast.error(
            `Cannot set ${LABELS[key]} below current usage (${usageVal})`
          )
          continue
        }

        // Map back to API resource
        const resourceEntry = Object.entries(RESOURCE_TYPE_TO_KEY).find(
          ([, mapped]) => mapped === key
        )
        if (!resourceEntry) continue
        const [resource] = resourceEntry as [ResourceType, LimitKey]

        const payload = {
          resource,
          max_total: newVal,
          max_per_branch: newVal, // same for now
        }

        await updateLimit({
          orgRef: orgSlug,
          projectRef,
          limit: payload,
        })
      }

      toast.success('Limits updated successfully')
      form.reset(values)
    } catch (err) {
      console.error(err)
      toast.error('Failed to update limits')
    }
  }

  /* ------------------------------------------------------------------
     Render
  -------------------------------------------------------------------*/

  return (
    <Form_Shadcn_ {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
        className="flex flex-col gap-8 p-8 max-w-[1200px] mx-auto"
      >
        <header>
          <h1 className="text-xl font-semibold">Resource limits</h1>
          <p className="text-sm text-foreground-muted">
            Adjust the compute and storage ceilings for this project.
          </p>
        </header>

        <section className="rounded-lg border p-6 space-y-6 bg-surface">
          {finalLimitConfig.map((limit) => {
            const usagePercent = (limit.usage / limit.value) * 100
            const nearLimit = usagePercent > 90

            return (
              <FormField_Shadcn_
                key={limit.key}
                control={form.control}
                name={limit.key}
                render={({ field }) => (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label_Shadcn_
                        htmlFor={`limit-${limit.key}`}
                        className="text-xs font-medium text-foreground"
                      >
                        {limit.label}
                      </Label_Shadcn_>
                      <div className="text-right">
                        <div
                          className={cn(
                            'text-[11px]',
                            nearLimit
                              ? 'text-destructive'
                              : 'text-foreground-muted'
                          )}
                        >
                          Usage: {limit.usage} {limit.unit}
                        </div>
                        <div className="text-[11px] text-foreground-muted">
                          Limit: {field.value} {limit.unit}
                        </div>
                      </div>
                    </div>

                    <Slider_Shadcn_
                      id={`limit-${limit.key}`}
                      min={limit.min}
                      max={limit.max}
                      step={limit.step}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                  </div>
                )}
              />
            )
          })}
        </section>

        <div className="flex justify-end">
          <Button type="primary" htmlType="submit">
            Save changes
          </Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}

/* ------------------------------------------------------------------
   Layout wrappers
-------------------------------------------------------------------*/

ResourceLimit.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ResourceLimit
