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
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchBackupSchedulesQuery } from 'data/backups/branch-backup-schedules-query'
import { useUpdateBranchBackupScheduleMutation } from 'data/backups/branch-update-backup-schedule-mutation'
import { useDeleteBranchBackupScheduleMutation } from 'data/backups/branch-delete-backup-schedule-mutation'

const TIME_UNITS = [
  { label: 'Minutes', value: 'minutes', minutes: 1 },
  { label: 'Hours', value: 'hours', minutes: 60 },
  { label: 'Days', value: 'days', minutes: 1440 },
  { label: 'Weeks', value: 'weeks', minutes: 10080 },
  { label: 'Months', value: 'months', minutes: 43200 },
] as const

const MIN_INTERVAL_MINUTES = 15
const DEFAULT_MAX_BACKUPS = 20

type TimeUnit = (typeof TIME_UNITS)[number]['value']
type ScheduleRow = { id: string; every: number; unit: TimeUnit; repeat: number }

const unitMinutesLookup: Record<TimeUnit, number> = TIME_UNITS.reduce((acc, unit) => {
  acc[unit.value] = unit.minutes
  return acc
}, {} as Record<TimeUnit, number>)

const getMinimumEveryForUnit = (unit: TimeUnit) =>
  Math.max(1, Math.ceil(MIN_INTERVAL_MINUTES / unitMinutesLookup[unit]))

const getRowMinutes = (row: ScheduleRow) => row.every * unitMinutesLookup[row.unit]

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
    .map((row, index) => ({
      id: `row-${index + 1}`,
      every: row.interval,
      unit: row.unit as TimeUnit,
      repeat: row.retention,
    }))

const toApiRows = (row: ScheduleRow, index: number): ApiSchedule['rows'][number] => ({
  row_index: index,
  interval: row.every,
  unit: row.unit,
  retention: row.repeat,
})

const toArray = <T,>(value: T | T[] | undefined | null) =>
  Array.isArray(value) ? value : value ? [value] : []

const formatEnvironmentLabel = (value: string) =>
  value === 'all'
    ? 'All environments'
    : value
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase())

const getScheduleForLabel = (label: string, schedules: ApiSchedule[]) => {
  if (label === 'all') {
    return schedules.find((schedule) => !schedule.env_type || schedule.env_type === 'all')
  }
  return schedules.find((schedule) => schedule.env_type === label)
}

const BranchScheduleModal = () => {
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<string>('all')
  const [rows, setRows] = useState<ScheduleRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const idCounterRef = useRef(0)

  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const { data: org } = useSelectedOrganizationQuery()
  const { data: project } = useSelectedProjectQuery()

  const { data: schedulesData, isLoading: schedulesLoading } = useBranchBackupSchedulesQuery(
    { orgId, projectId, branchId },
    { enabled: Boolean(orgId && projectId && branchId) }
  )

  const schedulesList = useMemo(
    () => toArray<ApiSchedule>(schedulesData),
    [schedulesData]
  )

  const maxBackupsAllowed = useMemo(() => {
    const value = project?.max_backups ?? org?.max_backups ?? DEFAULT_MAX_BACKUPS
    return Math.max(1, value)
  }, [project?.max_backups, org?.max_backups])

  const environmentOptions = useMemo(() => {
    const optionMap = new Map<string, string>()
    optionMap.set('all', 'All environments')

    const envTypes = Array.isArray(org?.env_types) ? org?.env_types : []
    envTypes.forEach((env) => {
      if (env) optionMap.set(env, formatEnvironmentLabel(env))
    })

    schedulesList.forEach((schedule) => {
      const envType = schedule.env_type
      if (envType) optionMap.set(envType, formatEnvironmentLabel(envType))
    })

    return Array.from(optionMap.entries()).map(([value, label]) => ({ value, label }))
  }, [org?.env_types, schedulesList])

  useEffect(() => {
    if (environmentOptions.length === 0) return
    if (!environmentOptions.some((option) => option.value === selectedLabel)) {
      setSelectedLabel(environmentOptions[0].value)
    }
  }, [environmentOptions, selectedLabel])

  const currentSchedule = useMemo(
    () => getScheduleForLabel(selectedLabel, schedulesList),
    [selectedLabel, schedulesList]
  )

  const { mutateAsync: updateSchedule, isLoading: saving } = useUpdateBranchBackupScheduleMutation({
    onSuccess: () => setOpen(false),
  })

  const { mutateAsync: deleteSchedule, isLoading: deleting } = useDeleteBranchBackupScheduleMutation({
    onSuccess: () => setOpen(false),
  })

  const isSubmitting = saving || deleting

  const newRowId = () => {
    idCounterRef.current += 1
    return `row-${idCounterRef.current}`
  }

  const resetState = useCallback(
    (label?: string) => {
      const defaultLabel = label ?? (environmentOptions[0]?.value ?? 'all')
      setSelectedLabel(defaultLabel)
      const schedule = getScheduleForLabel(defaultLabel, schedulesList)
      idCounterRef.current = 0
      setRows(schedule?.rows?.length ? fromApiRowsToUi(schedule.rows) : [])
      setError(null)
    },
    [environmentOptions, schedulesList]
  )

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetState()
    }
    setOpen(nextOpen)
  }

  useEffect(() => {
    if (!open) return
    const schedule = currentSchedule
    idCounterRef.current = 0
    setRows(schedule?.rows?.length ? fromApiRowsToUi(schedule.rows) : [])
    setError(null)
  }, [open, currentSchedule])

  const handleLabelChange = useCallback(
    (value: string) => {
      setSelectedLabel(value)
      const schedule = getScheduleForLabel(value, schedulesList)
      idCounterRef.current = 0
      setRows(schedule?.rows?.length ? fromApiRowsToUi(schedule.rows) : [])
      setError(null)
    },
    [schedulesList]
  )

  const totalRepeat = useMemo(() => rows.reduce((sum, row) => sum + row.repeat, 0), [rows])
  const remainingRepeatCapacity = Math.max(0, maxBackupsAllowed - totalRepeat)
  const canAddRow = remainingRepeatCapacity > 0

  const handleEveryChange =
    (id: string) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setRows((prev) => {
        const index = prev.findIndex((row) => row.id === id)
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
    (id: string) =>
    (value: string) => {
      const unit = (value as TimeUnit) || 'minutes'
      setRows((prev) => {
        const index = prev.findIndex((row) => row.id === id)
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
      const index = prev.findIndex((row) => row.id === id)
      if (index === -1) return prev

      const current = prev[index]
      const otherTotal = prev.reduce((sum, row, rowIndex) => (rowIndex === index ? sum : sum + row.repeat), 0)
      const maxForRow = Math.max(1, maxBackupsAllowed - otherTotal)
      const nextValue = Math.min(maxForRow, Math.max(1, current.repeat + delta))
      if (nextValue === current.repeat) return prev

      const nextRows = [...prev]
      nextRows[index] = { ...current, repeat: nextValue }
      return nextRows
    })
    setError(null)
  }

  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id))
    setError(null)
  }

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
    for (let i = 0; i < currentRows.length; i++) {
      const row = currentRows[i]
      if (getRowMinutes(row) < MIN_INTERVAL_MINUTES) return 'Minimum interval is 15 minutes.'
      if (i > 0 && getRowMinutes(row) <= getRowMinutes(currentRows[i - 1])) {
        return 'Each schedule must cover a longer timeframe than the previous one.'
      }
    }
    const total = currentRows.reduce((sum, row) => sum + row.repeat, 0)
    if (total > maxBackupsAllowed) {
      return `The total number of retained backups cannot exceed ${maxBackupsAllowed}.`
    }
    return null
  }, [maxBackupsAllowed])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!orgId || !projectId || !branchId || isSubmitting) return

    if (rows.length === 0) {
      if (currentSchedule?.id) {
        await deleteSchedule({
          orgId,
          projectId,
          branchId,
        })
      } else {
        setError('Add at least one schedule.')
      }
      return
    }

    const validationMessage = validateRows(rows)
    if (validationMessage) return setError(validationMessage)

    const env_type = selectedLabel === 'all' ? undefined : selectedLabel
    const apiRows = rows.map(toApiRows)

    await updateSchedule({
      orgId,
      projectId,
      branchId,
      schedule: {
        env_type,
        rows: apiRows,
        id: currentSchedule?.id,
      },
    })
  }

  const primaryButtonLabel = (() => {
    if (deleting) return 'Deleting…'
    if (saving) return currentSchedule ? 'Saving…' : 'Creating…'
    if (rows.length === 0 && currentSchedule) return 'Delete schedule'
    return currentSchedule ? 'Update schedule' : 'Create schedule'
  })()

  const isSubmitDisabled =
    isSubmitting ||
    (rows.length === 0 && !currentSchedule) ||
    environmentOptions.length === 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="default" disabled={schedulesLoading && !open}>
          Configure branch schedule
        </Button>
      </DialogTrigger>
      <DialogContent size="xxlarge" className="max-h-[85vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader padding="small" className="border-b">
            <DialogTitle>Branch Backup Schedule</DialogTitle>
          </DialogHeader>

          <DialogSection padding="medium" className="space-y-6">
            <div className="space-y-1">
              <p className="text-sm text-foreground-light">
                Configure automated backups for this branch, adjust cadence, or remove the schedule entirely.
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-foreground-light space-y-1">
              <p>
                You can retain up to{' '}
                <span className="font-medium text-foreground">{maxBackupsAllowed}</span> backups for this branch.
              </p>
              <p className="text-xs text-foreground-muted">
                Remaining retention slots: <span className="font-medium text-foreground">{remainingRepeatCapacity}</span>
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2 md:max-w-sm">
                <Label_Shadcn_ htmlFor="branch-backup-label">Environment</Label_Shadcn_>
                <Select_Shadcn_
                  value={selectedLabel}
                  onValueChange={handleLabelChange}
                  disabled={isSubmitting || schedulesLoading || environmentOptions.length === 0}
                >
                  <SelectTrigger_Shadcn_ id="branch-backup-label">
                    <SelectValue_Shadcn_ placeholder="Select environment" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {environmentOptions.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {rows.map((row, index) => {
                const previousRow = index > 0 ? rows[index - 1] : undefined
                const nextRow = index < rows.length - 1 ? rows[index + 1] : undefined
                const previousMinutes = previousRow ? getRowMinutes(previousRow) : 0
                const nextMinutes = nextRow ? getRowMinutes(nextRow) : null
                const baseMinimumEvery = getMinimumEveryForUnit(row.unit)
                const unitMinutes = unitMinutesLookup[row.unit]
                const minimumMinutesConstraint = previousRow ? previousMinutes + 1 : MIN_INTERVAL_MINUTES
                const computedMinEvery = Math.max(
                  baseMinimumEvery,
                  Math.ceil(minimumMinutesConstraint / unitMinutes)
                )
                const computedMaxEvery =
                  nextMinutes !== null ? Math.floor((nextMinutes - 1) / unitMinutes) : undefined
                const hasValidRange =
                  computedMaxEvery === undefined || computedMaxEvery >= computedMinEvery
                const otherTotal = totalRepeat - row.repeat
                const rowCapacity = maxBackupsAllowed - otherTotal
                const maxRepeat = Math.max(1, rowCapacity)
                const isLastRow = index === rows.length - 1
                const allowedUnits = isLastRow
                  ? TIME_UNITS.filter((unitOption) => {
                      if (!previousRow) return true
                      if (unitOption.value === row.unit) return true
                      return unitOption.minutes > unitMinutesLookup[previousRow.unit]
                    })
                  : TIME_UNITS

                return (
                  <div
                    key={row.id}
                    className="grid gap-4 md:grid-cols-[minmax(0,130px)_minmax(0,160px)_minmax(0,130px)_auto]"
                  >
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-every`}>Every</Label_Shadcn_>
                      <Input_Shadcn_
                        id={`${row.id}-every`}
                        type="number"
                        min={computedMinEvery}
                        max={hasValidRange ? computedMaxEvery : undefined}
                        disabled={!hasValidRange || isSubmitting}
                        value={row.every}
                        onChange={handleEveryChange(row.id)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-unit`}>
                        Time unit
                        {!isLastRow && <span className="ml-2 text-xs text-foreground-muted">Locked</span>}
                      </Label_Shadcn_>
                      <Select_Shadcn_
                        value={row.unit}
                        onValueChange={handleUnitChange(row.id)}
                        disabled={!isLastRow || isSubmitting}
                      >
                        <SelectTrigger_Shadcn_ id={`${row.id}-unit`}>
                          <SelectValue_Shadcn_ placeholder="Select unit" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {allowedUnits.map((unitOption) => (
                            <SelectItem_Shadcn_ key={unitOption.value} value={unitOption.value}>
                              {unitOption.label}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </div>
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-repeat`}>Retention</Label_Shadcn_>
                      <div className="flex items-center gap-2">
                        <Button
                          type="text"
                          size="tiny"
                          className="h-8 w-8 p-0"
                          htmlType="button"
                          onClick={() => handleRepeatAdjust(row.id, -1)}
                          disabled={row.repeat <= 1 || isSubmitting}
                          aria-label="Decrease repeats"
                        >
                          <MinusCircle size={16} />
                        </Button>
                        <Input_Shadcn_
                          id={`${row.id}-repeat`}
                          type="number"
                          min={1}
                          max={maxRepeat}
                          readOnly
                          value={row.repeat}
                          className="text-center"
                        />
                        <Button
                          type="text"
                          size="tiny"
                          className="h-8 w-8 p-0"
                          htmlType="button"
                          onClick={() => handleRepeatAdjust(row.id, 1)}
                          disabled={row.repeat >= maxRepeat || isSubmitting}
                          aria-label="Increase repeats"
                        >
                          <PlusCircle size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="text"
                        size="tiny"
                        className="h-9 w-9 p-0"
                        onClick={() => handleRemoveRow(row.id)}
                        disabled={isSubmitting}
                        htmlType="button"
                        aria-label="Remove schedule"
                      >
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
                  disabled={!canAddRow || isSubmitting}
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
            <Button type="default" htmlType="button" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" disabled={isSubmitting || (rows.length === 0 && !currentSchedule)}>
              {primaryButtonLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BranchScheduleModal
