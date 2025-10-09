import { MinusCircle, PlusCircle, Trash2 } from 'lucide-react'
import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from 'react'
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

const LABEL_OPTIONS = [
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

type ScheduleRow = {
  id: string
  every: number
  unit: TimeUnit
  repeat: number
}

const DEFAULT_ROWS: Array<Omit<ScheduleRow, 'id'>> = [
  { every: 15, unit: 'minutes', repeat: 4 },
  { every: 1, unit: 'hours', repeat: 11 },
  { every: 7, unit: 'days', repeat: 4 },
]

const unitMinutesLookup: Record<TimeUnit, number> = TIME_UNITS.reduce((acc, unit) => {
  acc[unit.value] = unit.minutes
  return acc
}, {} as Record<TimeUnit, number>)

const getMinimumEveryForUnit = (unit: TimeUnit) => {
  const multiplier = unitMinutesLookup[unit]
  return Math.max(1, Math.ceil(MIN_INTERVAL_MINUTES / multiplier))
}

const getRowMinutes = (row: ScheduleRow) => {
  return row.every * unitMinutesLookup[row.unit]
}

const BackupScheduleModal = () => {
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState<(typeof LABEL_OPTIONS)[number]['value']>('development')
  const idCounterRef = useRef(0)
  const [rows, setRows] = useState<ScheduleRow[]>(() => {
    return DEFAULT_ROWS.map((row) => {
      idCounterRef.current += 1
      return { ...row, id: `row-${idCounterRef.current}` }
    })
  })
  const [error, setError] = useState<string | null>(null)

  const totalRepeat = useMemo(
    () => rows.reduce((sum, row) => sum + row.repeat, 0),
    [rows]
  )

  const remainingRepeatCapacity = MAX_REPEAT_SUM - totalRepeat
  const canAddRow = remainingRepeatCapacity > 0

  const resetState = useCallback(() => {
    idCounterRef.current = 0
    setRows(
      DEFAULT_ROWS.map((row) => {
        idCounterRef.current += 1
        return { ...row, id: `row-${idCounterRef.current}` }
      })
    )
    setSelectedLabel('development')
    setError(null)
  }, [])

  const handleLabelChange = useCallback((value: string) => {
    setSelectedLabel(value as (typeof LABEL_OPTIONS)[number]['value'])
    setError(null)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      resetState()
    }
    setOpen(nextOpen)
  }

  const handleEveryChange = useCallback(
    (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = Number(event.target.value)
      setRows((prev) => {
        const index = prev.findIndex((row) => row.id === id)
        if (index === -1) return prev

        const row = prev[index]
        const unitMinutes = unitMinutesLookup[row.unit]
        const previousRow = index > 0 ? prev[index - 1] : undefined
        const nextRow = index < prev.length - 1 ? prev[index + 1] : undefined
        const baseMinimumEvery = getMinimumEveryForUnit(row.unit)
        const minMinutesConstraint = previousRow
          ? getRowMinutes(previousRow) + 1
          : MIN_INTERVAL_MINUTES
        const maxMinutesConstraint = nextRow ? getRowMinutes(nextRow) - 1 : Number.POSITIVE_INFINITY

        let sanitizedEvery = Number.isFinite(value) ? Math.max(baseMinimumEvery, value) : baseMinimumEvery
        let targetMinutes = sanitizedEvery * unitMinutes

        if (targetMinutes < minMinutesConstraint) {
          sanitizedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
          targetMinutes = sanitizedEvery * unitMinutes
        }

        if (maxMinutesConstraint !== Number.POSITIVE_INFINITY && targetMinutes > maxMinutesConstraint) {
          sanitizedEvery = Math.floor(maxMinutesConstraint / unitMinutes)
          if (sanitizedEvery < baseMinimumEvery) {
            return prev
          }
          targetMinutes = sanitizedEvery * unitMinutes
          if (targetMinutes < minMinutesConstraint) {
            sanitizedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
            targetMinutes = sanitizedEvery * unitMinutes
          }
          if (targetMinutes > maxMinutesConstraint) {
            return prev
          }
        }

        if (sanitizedEvery === row.every) {
          return prev
        }

        const nextRows = [...prev]
        nextRows[index] = { ...row, every: sanitizedEvery }
        return nextRows
      })
      setError(null)
    },
    []
  )

  const handleUnitChange = useCallback(
    (id: string) => (value: string) => {
      const unit = (value as TimeUnit) || 'minutes'
      setRows((prev) => {
        const index = prev.findIndex((row) => row.id === id)
        if (index === -1) return prev

        const current = prev[index]
        const previousRow = index > 0 ? prev[index - 1] : undefined
        const nextRow = index < prev.length - 1 ? prev[index + 1] : undefined

        if (previousRow && unitMinutesLookup[unit] < unitMinutesLookup[previousRow.unit]) {
          return prev
        }

        const unitMinutes = unitMinutesLookup[unit]
        const baseMinimumEvery = getMinimumEveryForUnit(unit)
        const minMinutesConstraint = previousRow
          ? getRowMinutes(previousRow) + 1
          : MIN_INTERVAL_MINUTES
        const maxMinutesConstraint = nextRow ? getRowMinutes(nextRow) - 1 : Number.POSITIVE_INFINITY

        let adjustedEvery = Math.max(baseMinimumEvery, Math.ceil(minMinutesConstraint / unitMinutes))
        let targetMinutes = adjustedEvery * unitMinutes

        if (maxMinutesConstraint !== Number.POSITIVE_INFINITY && targetMinutes > maxMinutesConstraint) {
          adjustedEvery = Math.floor(maxMinutesConstraint / unitMinutes)
          if (adjustedEvery < baseMinimumEvery) {
            return prev
          }
          targetMinutes = adjustedEvery * unitMinutes
          if (targetMinutes < minMinutesConstraint) {
            adjustedEvery = Math.ceil(minMinutesConstraint / unitMinutes)
            targetMinutes = adjustedEvery * unitMinutes
          }
          if (targetMinutes > maxMinutesConstraint) {
            return prev
          }
        }

        if (current.unit === unit && current.every === adjustedEvery) {
          return prev
        }

        const nextRows = [...prev]
        nextRows[index] = { ...current, unit, every: adjustedEvery }
        return nextRows
      })
      setError(null)
    },
    []
  )

  const handleRepeatAdjust = useCallback((id: string, delta: number) => {
    if (delta === 0) return
    setRows((prev) => {
      const index = prev.findIndex((row) => row.id === id)
      if (index === -1) return prev

      const current = prev[index]
      const otherTotal = prev.reduce((sum, row, rowIndex) => (rowIndex === index ? sum : sum + row.repeat), 0)
      const maxForRow = Math.max(1, MAX_REPEAT_SUM - otherTotal)
      const nextValue = Math.min(maxForRow, Math.max(1, current.repeat + delta))

      if (nextValue === current.repeat) {
        return prev
      }

      const nextRows = [...prev]
      nextRows[index] = { ...current, repeat: nextValue }
      return nextRows
    })
    setError(null)
  }, [])

  const handleRemoveRow = useCallback(
    (id: string) => {
      setRows((prev) => prev.filter((row) => row.id !== id))
      setError(null)
    },
    []
  )

  const createNextRow = useCallback((): Omit<ScheduleRow, 'id'> => {
    const lastRow = rows[rows.length - 1]
    if (!lastRow) {
      return {
        every: getMinimumEveryForUnit('minutes'),
        unit: 'minutes',
        repeat: 1,
      }
    }

    const lastMinutes = getRowMinutes(lastRow)
    const lastUnitIndex = TIME_UNITS.findIndex((item) => item.value === lastRow.unit)
    const candidateUnits = [...TIME_UNITS.slice(lastUnitIndex + 1), TIME_UNITS[TIME_UNITS.length - 1]]

    for (const unit of candidateUnits) {
      const minEvery = getMinimumEveryForUnit(unit.value)
      const candidateEvery = Math.max(minEvery, Math.ceil((lastMinutes + 1) / unit.minutes))
      if (candidateEvery * unit.minutes > lastMinutes) {
        return {
          every: candidateEvery,
          unit: unit.value,
          repeat: 1,
        }
      }
    }

    const fallbackUnit = lastRow.unit
    const fallbackEvery = Math.max(
      lastRow.every + 1,
      getMinimumEveryForUnit(fallbackUnit),
      Math.ceil((lastMinutes + 1) / unitMinutesLookup[fallbackUnit])
    )

    return {
      every: fallbackEvery,
      unit: fallbackUnit,
      repeat: 1,
    }
  }, [rows])

  const handleAddRow = () => {
    if (!canAddRow) return
    const next = createNextRow()
    idCounterRef.current += 1
    setRows((prev) => [
      ...prev,
      {
        ...next,
        repeat: Math.min(next.repeat, MAX_REPEAT_SUM - prev.reduce((sum, row) => sum + row.repeat, 0)),
        id: `row-${idCounterRef.current}`,
      },
    ])
    setError(null)
  }

  const validateRows = useCallback((currentRows: ScheduleRow[]): string | null => {
    if (currentRows.length === 0) {
      return 'Add at least one schedule.'
    }

    for (const row of currentRows) {
      if (getRowMinutes(row) < MIN_INTERVAL_MINUTES) {
        return 'Minimum interval is 15 minutes.'
      }
    }

    for (let index = 1; index < currentRows.length; index += 1) {
      const previous = currentRows[index - 1]
      const current = currentRows[index]
      if (getRowMinutes(current) <= getRowMinutes(previous)) {
        return 'Each schedule must cover a longer timeframe than the previous one.'
      }
    }

    const total = currentRows.reduce((sum, row) => sum + row.repeat, 0)
    if (total > MAX_REPEAT_SUM) {
      return 'The total number of retained backups cannot exceed 20.'
    }

    return null
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationMessage = validateRows(rows)
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    const schedule = rows.map(({ every, unit, repeat }) => ({ every, unit, repeat }))
    console.log('Backup schedule config', {
      label: selectedLabel,
      schedule,
    })
    setOpen(false)
  }

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
                <Select_Shadcn_ value={selectedLabel} onValueChange={handleLabelChange}>
                  <SelectTrigger_Shadcn_ id="backup-label">
                    <SelectValue_Shadcn_ placeholder="Select label" />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {LABEL_OPTIONS.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </div>

              <div className="rounded-md border border-border bg-surface-100 px-4 py-3 md:max-w-xs">
                <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                  Remaining capacity
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {Math.max(0, remainingRepeatCapacity)}
                </p>
                <p className="text-xs text-foreground-muted">
                  Backups available before reaching the limit of {MAX_REPEAT_SUM}.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {rows.map((row, index) => {
                const unitMinutes = unitMinutesLookup[row.unit]
                const previousRow = index > 0 ? rows[index - 1] : undefined
                const nextRow = index < rows.length - 1 ? rows[index + 1] : undefined
                const previousMinutes = previousRow ? getRowMinutes(previousRow) : 0
                const nextMinutes = nextRow ? getRowMinutes(nextRow) : null
                const baseMinimumEvery = getMinimumEveryForUnit(row.unit)
                const minimumMinutesConstraint = previousRow
                  ? previousMinutes + 1
                  : MIN_INTERVAL_MINUTES
                const computedMinEvery = Math.max(
                  baseMinimumEvery,
                  Math.ceil(minimumMinutesConstraint / unitMinutes)
                )
                const computedMaxEvery =
                  nextMinutes !== null
                    ? Math.floor((nextMinutes - 1) / unitMinutes)
                    : undefined
                const hasValidRange =
                  computedMaxEvery === undefined || computedMaxEvery >= computedMinEvery
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
                        disabled={!hasValidRange}
                        value={row.every}
                        onChange={handleEveryChange(row.id)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label_Shadcn_ htmlFor={`${row.id}-unit`}>
                        Time unit
                        {!isLastRow && (
                          <span className="ml-2 text-xs text-foreground-muted">Locked</span>
                        )}
                      </Label_Shadcn_>
                      <Select_Shadcn_
                        value={row.unit}
                        onValueChange={handleUnitChange(row.id)}
                        disabled={!isLastRow}
                      >
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
                      <Label_Shadcn_ htmlFor={`${row.id}-repeat`}>Repeat</Label_Shadcn_>
                      <div className="flex items-center gap-2">
                        <Button
                          type="text"
                          size="tiny"
                          className="h-8 w-8 p-0"
                          htmlType="button"
                          onClick={() => handleRepeatAdjust(row.id, -1)}
                          disabled={row.repeat <= 1}
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
                          disabled={row.repeat >= maxRepeat}
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
                        disabled={rows.length === 1}
                        htmlType="button"
                        aria-label="Remove schedule"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-foreground-muted">
                The longest cadence controls timeframe changes. Add a new row if you need an even longer interval.
              </p>
              <div>
                <Button
                  type="dashed"
                  icon={<PlusCircle size={16} />}
                  className="h-9"
                  disabled={!canAddRow}
                  onClick={handleAddRow}
                  htmlType="button"
                  aria-label="Add schedule"
                >
                  Add schedule
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </DialogSection>

          <DialogSectionSeparator />

          <DialogFooter padding="small" className="gap-2">
            <Button type="default" htmlType="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" disabled={rows.length === 0}>
              Save schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BackupScheduleModal
