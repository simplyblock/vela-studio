import dayjs from 'dayjs'

import type { BackupRow } from './types'

const GB = 1024 * 1024 * 1024

export const initialBackupRows: BackupRow[] = [
  {
    id: 'project-alpha',
    projectName: 'Reference API',
    branchName: 'main',
    environment: 'production',
    lastBackupAt: dayjs().subtract(3, 'hours').toISOString(),
    nextBackupAt: dayjs().add(2, 'hours').toISOString(),
    storageUsedBytes: 210 * GB,
    autoBackupEnabled: true,
    resources: { vcpu: 4, ramGb: 16, nvmeGb: 250, storageGb: 512, iops: 6000 },
    schedule: [
      { every: 30, unit: 'minutes', repeat: 6 },
      { every: 6, unit: 'hours', repeat: 4 },
      { every: 1, unit: 'days', repeat: 7 },
    ],
    backups: [
      {
        id: 'alpha-2024-05-01-0100',
        createdAt: dayjs().subtract(1, 'day').set('hour', 1).set('minute', 0).toISOString(),
        sizeBytes: 18 * GB,
        status: 'completed',
      },
      {
        id: 'alpha-2024-05-01-0900',
        createdAt: dayjs().subtract(1, 'day').set('hour', 9).set('minute', 0).toISOString(),
        sizeBytes: 19 * GB,
        status: 'completed',
      },
      {
        id: 'alpha-2024-05-02-0100',
        createdAt: dayjs().set('hour', 1).set('minute', 0).toISOString(),
        sizeBytes: 18.5 * GB,
        status: 'completed',
      },
    ],
  },
  {
    id: 'marketing-site',
    projectName: 'Marketing Site',
    branchName: 'release',
    environment: 'test',
    lastBackupAt: dayjs().subtract(1, 'day').add(30, 'minutes').toISOString(),
    nextBackupAt: dayjs().add(6, 'hours').toISOString(),
    storageUsedBytes: 86 * GB,
    autoBackupEnabled: true,
    resources: { vcpu: 2, ramGb: 8, nvmeGb: 120, storageGb: 256, iops: 3200 },
    schedule: [
      { every: 1, unit: 'hours', repeat: 12 },
      { every: 1, unit: 'days', repeat: 5 },
      { every: 1, unit: 'weeks', repeat: 4 },
    ],
    backups: [
      {
        id: 'marketing-2024-04-28-2000',
        createdAt: dayjs().subtract(3, 'day').set('hour', 20).set('minute', 0).toISOString(),
        sizeBytes: 9 * GB,
        status: 'completed',
      },
      {
        id: 'marketing-2024-04-30-2000',
        createdAt: dayjs().subtract(1, 'day').set('hour', 20).set('minute', 0).toISOString(),
        sizeBytes: 9.5 * GB,
        status: 'completed',
      },
      {
        id: 'marketing-2024-05-01-0800',
        createdAt: dayjs().set('hour', 8).set('minute', 0).toISOString(),
        sizeBytes: 9.7 * GB,
        status: 'completed',
      },
    ],
  },
  {
    id: 'analytics-lab',
    projectName: 'Analytics Lab',
    branchName: 'experiment',
    environment: 'development',
    lastBackupAt: dayjs().subtract(2, 'days').toISOString(),
    nextBackupAt: null,
    storageUsedBytes: 44 * GB,
    autoBackupEnabled: false,
    resources: { vcpu: 2, ramGb: 4, nvmeGb: 64, storageGb: 128, iops: 1500 },
    schedule: [
      { every: 2, unit: 'hours', repeat: 4 },
      { every: 2, unit: 'days', repeat: 7 },
    ],
    backups: [
      {
        id: 'analytics-2024-04-25-0000',
        createdAt: dayjs().subtract(5, 'day').startOf('day').toISOString(),
        sizeBytes: 6 * GB,
        status: 'completed',
      },
      {
        id: 'analytics-2024-04-27-0000',
        createdAt: dayjs().subtract(3, 'day').startOf('day').toISOString(),
        sizeBytes: 6.2 * GB,
        status: 'completed',
      },
      {
        id: 'analytics-2024-04-30-0000',
        createdAt: dayjs().subtract(1, 'day').startOf('day').toISOString(),
        sizeBytes: 6.1 * GB,
        status: 'completed',
      },
    ],
  },
  {
    id: 'customer-data-hub',
    projectName: 'Customer Data Hub',
    branchName: 'stable',
    environment: 'production',
    lastBackupAt: dayjs().subtract(8, 'hours').toISOString(),
    nextBackupAt: dayjs().add(1, 'day').toISOString(),
    storageUsedBytes: 340 * GB,
    autoBackupEnabled: true,
    resources: { vcpu: 8, ramGb: 32, nvmeGb: 512, storageGb: 1024, iops: 8200 },
    schedule: [
      { every: 15, unit: 'minutes', repeat: 8 },
      { every: 4, unit: 'hours', repeat: 6 },
      { every: 2, unit: 'days', repeat: 10 },
    ],
    backups: [
      {
        id: 'customer-2024-05-01-0000',
        createdAt: dayjs().subtract(1, 'day').startOf('day').toISOString(),
        sizeBytes: 24 * GB,
        status: 'completed',
      },
      {
        id: 'customer-2024-05-01-0600',
        createdAt: dayjs().subtract(1, 'day').set('hour', 6).set('minute', 0).toISOString(),
        sizeBytes: 24.5 * GB,
        status: 'completed',
      },
      {
        id: 'customer-2024-05-01-1200',
        createdAt: dayjs().subtract(1, 'day').set('hour', 12).set('minute', 0).toISOString(),
        sizeBytes: 25 * GB,
        status: 'completed',
      },
      {
        id: 'customer-2024-05-01-1800',
        createdAt: dayjs().subtract(1, 'day').set('hour', 18).set('minute', 0).toISOString(),
        sizeBytes: 24.7 * GB,
        status: 'completed',
      },
      {
        id: 'customer-2024-05-02-0000',
        createdAt: dayjs().startOf('day').toISOString(),
        sizeBytes: 24.9 * GB,
        status: 'completed',
      },
    ],
  },
]
