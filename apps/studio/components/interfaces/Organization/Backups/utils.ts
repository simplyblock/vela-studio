import dayjs from 'dayjs'
import { dayjsUnitMap } from './constants'

export const formatBackupDate = (value: string | null) => {
  if (!value) return 'Not scheduled'
  return dayjs(value).format('MMM D, YYYY HH:mm')
}

type ApiSchedule =
  | {
      id: string
      organization_id: string | null
      branch_id: string | null
      env_type: string | null
      rows: { row_index: number; interval: number; unit: string; retention: number }[]
    }
  | undefined

type ApiBackup =
  | {
      id: string
      organization_id: string
      project_id: string
      branch_id: string
      row_index: number
      created_at: string
    }[]
  | undefined

// Minimal schedule shape the UI already expects (handleEnable reads every/unit)
type UiScheduleRow = {
  every: number
  unit: keyof typeof dayjsUnitMap // 'hours' | 'days' | etc. (whatever your map supports)
  retention?: number
}

// Create a map: branch_id -> schedule rows
export function mapSchedulesByBranch(s: ApiSchedule) {
  const byBranch = new Map<
    string,
    { env: string | null; schedule: UiScheduleRow[] }
  >()

  if (!s) return byBranch

  // One schedule object can represent one branch (based on your type)
  // If you expect multiple schedule objects, loop them; if only one, this still works.
  const sched = s
  if (sched.branch_id) {
    byBranch.set(sched.branch_id, {
      env: sched.env_type ?? null,
      schedule:
        sched.rows?.map((r) => ({
          every: r.interval,
          unit: (r.unit as UiScheduleRow['unit']) ?? 'hours',
          retention: r.retention,
        })) ?? [],
    })
  }
  return byBranch
}

// Create a map: branch_id -> backup snapshots
export function groupBackupsByBranch(d: ApiBackup) {
  const byBranch = new Map<string, { backups: any[]; projectId: string }>()
  if (!d) return byBranch

  for (const b of d) {
    const existing = byBranch.get(b.branch_id)
    const bb: any = {
      id: b.id,
      createdAt: b.created_at,

    } as any

    if (existing) {
      existing.backups.push(bb)
    } else {
      byBranch.set(b.branch_id, {
        backups: [bb],
        projectId: b.project_id,
      })
    }
  }
  return byBranch
}

