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
      rows?: { row_index: number; interval: number; unit: string; retention: number }[]
    }[]
  | null
  | undefined

type ApiBackup =
  | {
      id: string
      organization_id: string
      project_id: string
      branch_id: string
      row_index: number
      created_at: string
      size_bytes?: number | null
      status?: string | null
    }[]
  | null
  | undefined

// Minimal schedule shape the UI already expects (handleEnable reads every/unit)
type UiScheduleRow = {
  every: number
  unit: keyof typeof dayjsUnitMap // 'hours' | 'days' | etc. (whatever your map supports)
  retention?: number
}

// Create a map: branch_id -> schedule rows
export function mapSchedulesByBranch(s: ApiSchedule) {
  const byBranch = new Map<string, { env: string | null; schedule: UiScheduleRow[] }>()

  if (!Array.isArray(s)) return byBranch

  for (const sched of s) {
    if (!sched?.branch_id) continue

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
  const byBranch = new Map<
    string,
    { backups: { id: string; createdAt: string; sizeBytes?: number | null; status?: string | null; rowIndex?: number }[]; projectId: string }
  >()
  if (!Array.isArray(d)) return byBranch

  for (const b of d) {
    if (!b?.branch_id) continue

    const entry = byBranch.get(b.branch_id) ?? {
      backups: [] as {
        id: string
        createdAt: string
        sizeBytes?: number | null
        status?: string | null
        rowIndex?: number
      }[],
      projectId: b.project_id,
    }

    entry.backups.push({
      id: b.id,
      createdAt: b.created_at,
      sizeBytes: b.size_bytes ?? null,
      status: b.status ?? null,
      rowIndex: typeof b.row_index === 'number' ? b.row_index : undefined,
    })

    byBranch.set(b.branch_id, entry)
  }
  return byBranch
}
