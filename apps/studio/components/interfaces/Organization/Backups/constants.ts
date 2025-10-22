import type { ManipulateType } from 'dayjs'

import type { BackupEnvironment, BackupScheduleUnit } from './types'

export const UNIT_OPTIONS: { label: string; value: BackupScheduleUnit }[] = [
  { label: 'Minutes', value: 'minutes' },
  { label: 'Hours', value: 'hours' },
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
]

export const dayjsUnitMap: Record<BackupScheduleUnit, ManipulateType> = {
  minutes: 'minute',
  hours: 'hour',
  days: 'day',
  weeks: 'week',
  months: 'month',
}

const ENVIRONMENT_BADGE_MAP: Record<string, string> = {
  production: 'bg-brand-400/10 text-brand-600 border-brand-400/30',
  test: 'bg-warning-400/10 text-warning-700 border-warning-400/30',
  development: 'bg-foreground-muted/10 text-foreground border-foreground-muted/30',
}

export const getEnvironmentBadgeClass = (environment: BackupEnvironment) =>
  ENVIRONMENT_BADGE_MAP[environment] ?? 'bg-foreground-muted/10 text-foreground border-foreground-muted/30'
