export type BackupEnvironment = string

export type BackupScheduleUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months'

export type BackupScheduleEntry = {
  every: number
  unit: BackupScheduleUnit
  repeat: number
}

export type BranchResources = {
  vcpu: number
  ramGb: number
  nvmeGb: number
  storageGb: number
  iops: number
}

export type BranchBackup = {
  id: string
  createdAt: string | null
  rowIndex?: number | null
  sizeBytes?: number | null
  status?: string | null
}

export type BackupRow = {
  id: string
  projectId: string
  projectName: string
  branchId: string
  branchName: string
  environment: BackupEnvironment
  lastBackupAt: string | null
  nextBackupAt: string | null
  storageUsedBytes?: number | null
  autoBackupEnabled: boolean
  resources?: BranchResources | null
  schedule: BackupScheduleEntry[]
  backups: BranchBackup[]
}
