import type { ReactNode } from 'react'

export type ResourceMetricKey =
  | 'vCpuHours'
  | 'ramHours'
  | 'iopsHours'
  | 'dbStorageHours'
  | 'storageHours'

export type BillingStatus = 'Current' | 'Closed' | 'Upcoming'

export interface BillingCycle {
  id: string
  label: string
  month: string
  year: number
  start: string
  end: string
  status: BillingStatus
  activeProjects: number
  totalRuntimeHours: number
  metrics: Record<ResourceMetricKey, number>
}

export interface BranchUsageRow {
  id: string
  project: string
  branch: string
  environment: 'production' | 'test' | 'development'
  vCpuHours: number
  ramHours: number
  iopsHours: number
  dbStorageHours: number
  storageHours: number
  totalRuntime: number
}

export type SortableColumn = Exclude<keyof BranchUsageRow, 'id'>

export interface ResourceMetricDefinition {
  key: ResourceMetricKey
  label: string
  summarySuffix: string
  icon: ReactNode
}

export type ExportFormat = 'excel' | 'pdf'

export interface ExportOption {
  value: ExportFormat
  label: string
  description: string
}

export interface SortConfig {
  column: SortableColumn
  direction: 'asc' | 'desc'
}
