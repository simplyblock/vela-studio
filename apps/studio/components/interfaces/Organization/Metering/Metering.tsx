'use client'

import { useEffect, useMemo, useState } from 'react'

import { Button, Listbox } from 'ui'
import { ScaffoldContainer, ScaffoldTitle } from 'components/layouts/Scaffold'
import { toast } from 'sonner'
import { Download } from 'lucide-react'

import BillingCycleCard from './BillingCycleCard'
import BranchUsageTable from './BranchUsageTable'
import ExportModal from './ExportModal'
import ResourceUsageStats from './ResourceUsageStats'
import {
  BILLING_CYCLES,
  EXPORT_OPTIONS,
  RESOURCE_METRICS,
} from './constants'
import { buildUsageForCycle } from './utils'
import type { ExportFormat, SortConfig, SortableColumn } from './types'

const DEFAULT_SORT: SortConfig = {
  column: 'totalRuntime',
  direction: 'desc',
}

const Metering = () => {
  const [selectedCycleId, setSelectedCycleId] = useState(BILLING_CYCLES[0].id)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel')
  const [sortConfig, setSortConfig] = useState<SortConfig>(DEFAULT_SORT)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const selectedCycle = useMemo(
    () => BILLING_CYCLES.find((cycle) => cycle.id === selectedCycleId) ?? BILLING_CYCLES[0],
    [selectedCycleId]
  )

  const cycleIndex = useMemo(
    () => Math.max(BILLING_CYCLES.findIndex((cycle) => cycle.id === selectedCycleId), 0),
    [selectedCycleId]
  )

  const resourceStats = useMemo(
    () =>
      RESOURCE_METRICS.map((metric) => ({
        ...metric,
        value: selectedCycle.metrics[metric.key],
      })),
    [selectedCycle]
  )

  const branchUsage = useMemo(
    () => buildUsageForCycle(selectedCycle, cycleIndex),
    [selectedCycle, cycleIndex]
  )

  const sortedRows = useMemo(() => {
    const rows = [...branchUsage]
    const { column, direction } = sortConfig

    return rows.sort((a, b) => {
      const multiplier = direction === 'asc' ? 1 : -1
      const valueA = a[column]
      const valueB = b[column]

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return (valueA - valueB) * multiplier
      }
      // @ts-ignore
      return valueA.localeCompare(valueB, undefined, { sensitivity: 'base' }) * multiplier
    })
  }, [branchUsage, sortConfig])

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(sortedRows.length / pageSize)),
    [sortedRows.length, pageSize]
  )

  const paginatedRows = useMemo(
    () => sortedRows.slice(page * pageSize, page * pageSize + pageSize),
    [sortedRows, page, pageSize]
  )

  useEffect(() => {
    setPage(0)
  }, [selectedCycleId, pageSize, sortConfig])

  useEffect(() => {
    if (page >= pageCount) {
      setPage(Math.max(pageCount - 1, 0))
    }
  }, [page, pageCount])

  const handleSort = (column: SortableColumn) => {
    setSortConfig((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }

      return {
        column,
        direction: 'desc',
      }
    })
  }

  const handleExport = () => {
    toast.success(`Preparing ${selectedCycle.label} usage export (${exportFormat.toUpperCase()})`)
    setExportModalOpen(false)
  }

  return (
    <ScaffoldContainer bottomPadding className="py-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <ScaffoldTitle className="text-2xl font-semibold text-foreground">Metering</ScaffoldTitle>
            <p className="text-sm text-foreground-light">
              Analyze resource consumption across projects, review billing cycles, and export usage snapshots.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Listbox
              size="tiny"
              value={selectedCycleId}
              onChange={(value: string) => setSelectedCycleId(value)}
              buttonClassName="w-[200px]"
            >
              {BILLING_CYCLES.map((cycle) => (
                <Listbox.Option key={cycle.id} id={cycle.id} value={cycle.id} label={cycle.label}>
                  {cycle.label}
                </Listbox.Option>
              ))}
            </Listbox>
            <Button size={"small"} icon={<Download size={16} />} type="default" onClick={() => setExportModalOpen(true)}>
              Export
            </Button>
          </div>
        </div>

        <BillingCycleCard cycle={selectedCycle} exportFormat={exportFormat} />

        <ResourceUsageStats metrics={resourceStats} />

        <BranchUsageTable
          rows={paginatedRows}
          sortConfig={sortConfig}
          onSort={handleSort}
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <ExportModal
        visible={exportModalOpen}
        format={exportFormat}
        options={EXPORT_OPTIONS}
        onFormatChange={setExportFormat}
        onCancel={() => setExportModalOpen(false)}
        onConfirm={handleExport}
      />
    </ScaffoldContainer>
  )
}

export default Metering
