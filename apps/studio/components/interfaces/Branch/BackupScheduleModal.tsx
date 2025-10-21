import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react'
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Input_Shadcn_,
  Label_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
} from 'ui'

import { useParams } from 'common'
import { useOrgBackupSchedulesQuery } from 'data/backups/org-backup-schedules-query'
import { useUpdateOrgBackupScheduleMutation } from 'data/backups/org-update-backup-schedule-mutation'

const LABEL_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Development', value: 'development' },
  { label: 'Staging', value: 'staging' },
  { label: 'Production', value: 'production' },
] as const

const TIME_UNITS = [
  { label: 'Minutes', value: 'minutes', minutes: 1 },
  { label: 'Hours', value: 'hours', minutes: 60 },
  { label: 'Days', value: 'days', minutes: 1440 },
  { label: 'Weeks', value: 'weeks', minutes: 10080 },
  { label: 'Months', value: 'months', minutes: 43200 },
] as const

const MIN_INTERVAL_MINUTES = 15
const MAX_REPEAT_SUM = 20

type TimeUnit = (typeof TIME_UNITS)[number]['value']
type ScheduleRow = { id: string; every: number; unit: TimeUnit; repeat: number }

const unitMinutesLookup: Record<TimeUnit, number> = TIME_UNITS.reduce((acc, u) => {
  acc[u.value] = u.minutes
  return acc
}, {} as Record<TimeUnit, number>)

const getMinimumEveryForUnit = (unit: TimeUnit) =>
  Math.max(1, Math.ceil(MIN_INTERVAL_MINUTES / unitMinutesLookup[unit]))

const getRowMinutes = (row: ScheduleRow) => row.every * unitMinutesLookup[row.unit]

// ---------- API mapping ----------
type ApiSchedule = {
  id: string
  organization_id: string | null
  branch_id: string | null
  env_type: string | null
  rows: { row_index: number; interval: number; unit: string; retention: number }[]
}

const fromApiRowsToUi = (apiRows: ApiSchedule['rows']): ScheduleRow[] =>
  apiRows
    .slice()
    .sort((a, b) => a.row_index - b.row_index)
    .map((r, i) => ({
      id: `row-${i + 1}`,
      every: r.interval,
      unit: r.unit as TimeUnit,
      repeat: r.retention,
    }))

const toApiRows = (uiRow: ScheduleRow, idx: number): ApiSchedule['rows'][number] => ({
  row_index: idx,
  interval: uiRow.every,
  unit: uiRow.unit,
  retention: uiRow.repeat,
})
// ----------------------------------

const BackupScheduleModal = () => {
  const [open, setOpen] = useState(false)
  // default label while opening modal is 'all'
  const [selectedLabel, setSelectedLabel] = useState<(typeof LABEL_OPTIONS)[number]['value']>('all')
  const [rows, setRows] = useState<ScheduleRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const idCounterRef = useRef(0)
  const newRowId = () => {
    idCounterRef.current += 1
    return `row-${idCounterRef.current}`
  }

  const { slug: orgId } = useParams()
  const { data: schedulesData, isLoading: schedulesLoading } = useOrgBackupSchedulesQuery(
    { orgId },
    { enabled: !!orgId }
  )

  const { mutateAsync: updateSchedule, isLoading: saving } = useUpdateOrgBackupScheduleMutation({
    onSuccess: () => setOpen(false),
  })

// pick schedule for selected env
// helper
const asArray = <T,>(x: T | T[] | undefined): T[] =>
  x ? (Array.isArray(x) ? x : [x]) : []

const currentSchedule: ApiSchedule | undefined = useMemo(() => {
  const list = asArray<ApiSchedule>(schedulesData)

  if (selectedLabel === 'all') {
    // treat missing/empty env_type as "all"
    return list.find((s) => !s.env_type || s.env_type === 'all')
  }
  return list.find((s) => s.env_type === selectedLabel)
}, [schedulesData, selectedLabel])

  // counts/capacity
  const totalRepeat = useMemo(() => rows.reduce((sum, r) => sum + r.repeat, 0), [rows])
  const remainingRepeatCapacity = MAX_REPEAT_SUM - totalRepeat
  const canAddRow = remainingRepeatCapacity > 0

  // open/reset: no defaults, hydrate if found, else empty
  const resetState = useCallback(() => {
    idCounterRef.current = 0
    setSelectedLabel('all')
    setError(null)
    setRows(currentSchedule?.rows?.length ? fromApiRowsToUi(currentSchedule.rows) : [])
  }, [currentSchedule])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) resetState()
    setOpen(nextOpen)
  }

  // react to env change or new data while open
  useEffect(() => {
    if (!open) return
    setRows(currentSchedule?.rows?.length ? fromApiRowsToUi(currentSchedule.rows) : [])
  }, [open, currentSchedule])

  const handleLabelChange = useCallback((value: string) => {
    setSelectedLabel(value as (typeof LABEL_OPTIONS)[number]['value'])
    setError(null)
  }, [])

  // ------- interactions (unchanged logic) -------
  const handleEveryChange =
    (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setRows((prev) => {
        const index = prev.findIndex((r) => r.id === id)
        if (index === -1) return prev

        const row = prev[index]
        const unitMinutes = unitMinutesLookup[row.unit]
        const previousRow = index > 0 ? prev[index - 1] : undefined
        const nextRow = index < prev.length - 1 ? prev[index + 1] : undefined
        const baseMinimumEvery = getMinimumEveryForUnit(row.unit)
        const minMinutesConstraint = previousRow ? getRowMinutes(previousRow) + 1 : MIN_INTERVAL_MINUTES
        const maxMinutesConstraint = nextRow ? getRowMinutes(nextRow) - 1 : Number.POSITIVE_INFINITY

        let sanitizedEvery = Number.isFinite(value) ? Math.max(baseMinimumEvery, value) : baseMinimumEvery
        let targetMinutes = sanitizedEvery * unitMinutes

        if (targetMinutes < minMinutesConstraint) {
          sanitizedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
          targetMinutes = sanitizedEvery * unitMinutes
        }
        if (maxMinutesConstraint !== Number.POSITIVE_INFINITY && targetMinutes > maxMinutesConstraint) {
          sanitizedEvery = Math.floor(maxMinutesConstraint / unitMinutes)
          if (sanitizedEvery < baseMinimumEvery) return prev
          targetMinutes = sanitizedEvery * unitMinutes
          if (targetMinutes < minMinutesConstraint) {
            sanitizedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
            targetMinutes = sanitizedEvery * unitMinutes
          }
          if (targetMinutes > maxMinutesConstraint) return prev
        }
        if (sanitizedEvery === row.every) return prev
        const nextRows = [...prev]
        nextRows[index] = { ...row, every: sanitizedEvery }
        return nextRows
      })
      setError(null)
    }

  const handleUnitChange =
    (id: string) => (value: string) => {
      const unit = (value as TimeUnit) || 'minutes'
      setRows((prev) => {
        const index = prev.findIndex((r) => r.id === id)
        if (index === -1) return prev

        const current = prev[index]
        const previousRow = index > 0 ? prev[index - 1] : undefined
        const nextRow = index < prev.length - 1 ? prev[index + 1] : undefined

        if (previousRow && unitMinutesLookup[unit] < unitMinutesLookup[previousRow.unit]) return prev

        const unitMinutes = unitMinutesLookup[unit]
        const baseMinimumEvery = getMinimumEveryForUnit(unit)
        const minMinutesConstraint = previousRow ? getRowMinutes(previousRow) + 1 : MIN_INTERVAL_MINUTES
        const maxMinutesConstraint = nextRow ? getRowMinutes(nextRow) - 1 : Number.POSITIVE_INFINITY

        let adjustedEvery = Math.max(baseMinimumEvery, Math.ceil(minMinutesConstraint / unitMinutes))
        let targetMinutes = adjustedEvery * unitMinutes

        if (maxMinutesConstraint !== Number.POSITIVE_INFINITY && targetMinutes > maxMinutesConstraint) {
          adjustedEvery = Math.floor(maxMinutesConstraint / unitMinutes)
          if (adjustedEvery < baseMinimumEvery) return prev
          targetMinutes = adjustedEvery * unitMinutes
          if (targetMinutes < minMinutesConstraint) {
            adjustedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
            targetMinutes = adjustedEvery * unitMinutes
          }
          if (targetMinutes > maxMinutesConstraint) return prev
        }
        if (current.unit === unit && current.every === adjustedEvery) return prev
        const nextRows = [...prev]
        nextRows[index] = { ...current, unit, every: adjustedEvery }
        return nextRows
      })
      setError(null)
    }

  const handleRepeatAdjust = (id: string, delta: number) => {
    if (delta === 0) return
    setRows((prev) => {
      const index = prev.findIndex((r) => r.id === id)
      if (index === -1) return prev
      const current = prev[index]
      const otherTotal = prev.reduce((sum, r, i) => (i === index ? sum : sum + r.repeat), 0)
      const maxForRow = Math.max(1, MAX_REPEAT_SUM - otherTotal)
      const nextValue = Math.min(maxForRow, Math.max(1, current.repeat + delta))
      if (nextValue === current.repeat) return prev
      const nextRows = [...prev]
      nextRows[index] = { ...current, repeat: nextValue }
      return nextRows
    })
    setError(null)
  }

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    setError(null)
  }

  // when no rows yet, this is the seed for "Add Row"
  const createNextRow = useCallback((): Omit<ScheduleRow, 'id'> => {
    const lastRow = rows[rows.length - 1]
    if (!lastRow) {
      return { every: getMinimumEveryForUnit('minutes'), unit: 'minutes', repeat: 1 }
    }
    const lastMinutes = getRowMinutes(lastRow)
    const lastUnitIndex = TIME_UNITS.findIndex((item) => item.value === lastRow.unit)
    const candidateUnits = [...TIME_UNITS.slice(lastUnitIndex + 1), TIME_UNITS[TIME_UNITS.length - 1]]

    for (const unit of candidateUnits) {
      const minEvery = getMinimumEveryForUnit(unit.value)
      const candidateEvery = Math.max(minEvery, Math.ceil((lastMinutes + 1) / unit.minutes))
      if (candidateEvery * unit.minutes > lastMinutes) {
        return { every: candidateEvery, unit: unit.value, repeat: 1 }
      }
    }

    const fallbackUnit = lastRow.unit
    const fallbackEvery = Math.max(
      lastRow.every + 1,
      getMinimumEveryForUnit(fallbackUnit),
      Math.ceil((lastMinutes + 1) / unitMinutesLookup[fallbackUnit])
    )
    return { every: fallbackEvery, unit: fallbackUnit, repeat: 1 }
  }, [rows])

  const handleAddRow = () => {
    if (!canAddRow) return
    const next = createNextRow()
    setRows((prev) => [...prev, { ...next, id: newRowId() }])
    setError(null)
  }

  const validateRows = useCallback((currentRows: ScheduleRow[]): string | null => {
    if (currentRows.length === 0) return 'Add at least one schedule.'
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i]
      if (getRowMinutes(row) < MIN_INTERVAL_MINUTES) return 'Minimum interval is 15 minutes.'
      if (i > 0 && getRowMinutes(row) <= getRowMinutes(currentRows[i - 1])) {
        return 'Each schedule must cover a longer timeframe than the previous one.'
      }
    }
    const total = currentRows.reduce((s, r) => s + r.repeat, 0)
    if (total > MAX_REPEAT_SUM) return 'The total number of retained backups cannot exceed 20.'
    return null
  }, [])
  // -----------------------------------------------

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const validationMessage = validateRows(rows)
    if (validationMessage) return setError(validationMessage)
    if (!orgId) return

    const env_type = selectedLabel === 'all' ? undefined : selectedLabel
    const apiRows = rows.map(toApiRows)

    await updateSchedule({
      orgId,
      schedule: {
        env_type,
        rows: apiRows,
        id: currentSchedule?.id, // include id if we’re updating an existing schedule
      },
    })
  }

  const isEmpty = rows.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="default">Configure backup schedule</Button>
      </DialogTrigger>
      <DialogContent size="xxlarge" className="max-h-[85vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Backup Default Schedules</DialogTitle>
          </DialogHeader>

          <DialogSection padding="medium" className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">
                Configure how often automated backups run and how many copies to keep for each cadence.
              </p>
              <p className="text-xs text-foreground-muted">
                Use longer intervals for lower-frequency backups to build a retention ladder without exceeding the 20 backup limit.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:max-w-sm">
                <Label_Shadcn_ htmlFor="backup-label">Label</Label_Shadcn_>
                <Select_Shadcn_ value={selectedLabel} onValueChange={handleLabelChange} disabled={schedulesLoading || saving}>
                  <SelectTrigger_Shadcn_ id="backup-label">
                    <SelectValue_Shadcn_ placeholder="Select label" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {LABEL_OPTIONS.map((opt) => (
                      <SelectItem_Shadcn_ key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>

              <div className="rounded-md border border-border bg-surface-100 px-4 py-3 md:max-w-xs">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">Remaining capacity</p>
                <p className="text-lg font-semibold text-foreground">{Math.max(0, MAX_REPEAT_SUM - totalRepeat)}</p>
                <p className="text-xs text-foreground-muted">Backups available before reaching the limit of {MAX_REPEAT_SUM}.</p>
              </div>
            </div>

            <div className="space-y-4">
              {isEmpty && (
                <div className="rounded border border-dashed px-4 py-6 text-sm text-foreground-muted">
                  No schedule for this label yet. Add your first row below.
                </div>
              )}

              {rows.map((row, index) => {
                const unitMinutes = unitMinutesLookup[row.unit]
                const previousRow = index > 0 ? rows[index - 1] : undefined
                const nextRow = index < rows.length - 1 ? rows[index + 1] : undefined
                const previousMinutes = previousRow ? getRowMinutes(previousRow) : 0
                const nextMinutes = nextRow ? getRowMinutes(nextRow) : null
                const baseMinimumEvery = getMinimumEveryForUnit(row.unit)
                const minimumMinutesConstraint = previousRow ? previousMinutes + 1 : MIN_INTERVAL_MINUTES
                const computedMinEvery = Math.max(baseMinimumEvery, Math.ceil(minimumMinutesConstraint / unitMinutes))
                const computedMaxEvery = nextMinutes !== null ? Math.floor((nextMinutes - 1) / unitMinutes) : undefined
                const hasValidRange = computedMaxEvery === undefined || computedMaxEvery >= computedMinEvery
                const otherTotal = totalRepeat - row.repeat
                const rowCapacity = MAX_REPEAT_SUM - otherTotal
                const maxRepeat = Math.max(1, rowCapacity)
                const isLastRow = index === rows.length - 1
                const allowedUnits = isLastRow
                  ? TIME_UNITS.filter((unit) => {
                      if (!previousRow) return true
                      if (unit.value === row.unit) return true
                      return unit.minutes > unitMinutesLookup[previousRow.unit]
                    })
                  : TIME_UNITS

                return (
                  <div key={row.id} className="grid gap-4 md:grid-cols-[minmax(0,130px)_minmax(0,160px)_minmax(0,130px)_auto]">
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-every`}>Every</Label_Shadcn_>
                      <Input_Shadcn_
                        id={`${row.id}-every`}
                        type="number"
                        min={computedMinEvery}
                        max={hasValidRange ? computedMaxEvery : undefined}
                        disabled={!hasValidRange || saving}
                        value={row.every}
                        onChange={handleEveryChange(row.id)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-unit`}>
                        Time unit{!isLastRow && <span className="ml-2 text-xs text-foreground-muted">Locked</span>}
                      </Label_Shadcn_>
                      <Select_Shadcn_ value={row.unit} onValueChange={handleUnitChange(row.id)} disabled={!isLastRow || saving}>
                        <SelectTrigger_Shadcn_ id={`${row.id}-unit`}>
                          <SelectValue_Shadcn_ placeholder="Select unit" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {allowedUnits.map((unit) => (
                            <SelectItem_Shadcn_ key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-repeat`}>Retention</Label_Shadcn_>
                      <div className="flex items-center gap-2">
                        <Button type="text" size="tiny" className="h-8 w-8 p-0" htmlType="button" onClick={() => handleRepeatAdjust(row.id, -1)} disabled={row.repeat <= 1 || saving} aria-label="Decrease repeats">
                          <MinusCircle size={16} />
                        </Button>
                        <Input_Shadcn_ id={`${row.id}-repeat`} type="number" min={1} max={maxRepeat} readOnly value={row.repeat} className="text-center" />
                        <Button type="text" size="tiny" className="h-8 w-8 p-0" htmlType="button" onClick={() => handleRepeatAdjust(row.id, 1)} disabled={row.repeat >= maxRepeat || saving} aria-label="Increase repeats">
                          <PlusCircle size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button type="text" size="tiny" className="h-9 w-9 p-0" onClick={() => handleRemoveRow(row.id)} disabled={rows.length === 1 || saving} htmlType="button" aria-label="Remove schedule">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                )
              })}

              <div>
                <Button
                  type="dashed"
                  icon={<PlusCircle size={16} />}
                  className="h-9"
                  disabled={!canAddRow || saving}
                  onClick={handleAddRow}
                  htmlType="button"
                  aria-label="Add schedule"
                >
                  Add Row
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" disabled={rows.length === 0 || saving}>
              {saving ? 'Saving…' : currentSchedule ? 'Update schedule' : 'Create schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BackupScheduleModal
