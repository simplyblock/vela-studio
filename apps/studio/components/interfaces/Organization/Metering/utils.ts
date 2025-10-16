import dayjs from 'dayjs'

import { BASE_BRANCH_USAGE } from './constants'
import type { BillingCycle, BranchUsageRow } from './types'

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const hourFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
})

export const formatCompactNumber = (value: number) => compactNumberFormatter.format(value)
export const formatInteger = (value: number) => integerFormatter.format(value)
export const formatHours = (value: number) => hourFormatter.format(value)

export const formatPeriod = (start: string, end: string) => {
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  return `${startDate.format('MMM D')} – ${endDate.format('MMM D')}`
}

export const buildUsageForCycle = (cycle: BillingCycle, cycleIndex: number): BranchUsageRow[] => {
  const hasUsage = Object.values(cycle.metrics).some((value) => value > 0)
  if (!hasUsage) {
    return BASE_BRANCH_USAGE.map((row) => ({
      ...row,
      vCpuHours: 0,
      ramHours: 0,
      iopsHours: 0,
      dbStorageHours: 0,
      storageHours: 0,
      totalRuntime: 0,
    }))
  }

  const multiplier = 1 + cycleIndex * 0.08

  return BASE_BRANCH_USAGE.map((row) => ({
    ...row,
    vCpuHours: Math.round(row.vCpuHours * multiplier),
    ramHours: Math.round(row.ramHours * multiplier),
    iopsHours: Math.round(row.iopsHours * multiplier),
    dbStorageHours: Math.round(row.dbStorageHours * multiplier),
    storageHours: Math.round(row.storageHours * multiplier),
    totalRuntime: Math.round(row.totalRuntime * multiplier * 10) / 10,
  }))
}
