export type BackupEnvironment = 'production' | 'test' | 'development'

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
  createdAt: string
  sizeBytes: number
  status: 'completed' | 'in-progress'
}

export type BackupRow = {
  id: string
  projectName: string
  branchName: string
  environment: BackupEnvironment
  lastBackupAt: string
  nextBackupAt: string | null
  storageUsedBytes: number
  autoBackupEnabled: boolean
  resources: BranchResources
  schedule: BackupScheduleEntry[]
  backups: BranchBackup[]
}
