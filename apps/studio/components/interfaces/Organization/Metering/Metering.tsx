'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from 'ui'
import { ScaffoldContainer, ScaffoldTitle } from 'components/layouts/Scaffold'
import { LogsDatePicker } from 'components/interfaces/Settings/Logs/Logs.DatePickers'
import ResourceUsageStats, { ResourceUsageMetric } from './ResourceUsageStats'
import ExportModal from './ExportModal'
import { EXPORT_OPTIONS } from './constants'
import type { ExportFormat } from './types'
import { useOrganizationUsageQuery } from 'data/resources/organization-usage-query'
import { useOrganizationMeteringQuery } from 'data/resources/organization-metering-query'
import PerBranchUsageTable from './PerBranchUsageTable'
type DateRange = {
  from: string
  to: string
  isHelper?: boolean
  text?: string
}

const Metering = () => {
  const { slug: orgRef } = useParams()

  // Default: last month → now (UTC)
  const now = dayjs().utc().set('millisecond', 0)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: now.subtract(1, 'month').toISOString(),
    to: now.toISOString(),
  })

  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel')

  const {
    data: orgUsage,
    isLoading: usageLoading,
    isError: usageError,
    error: usageErrorObj,
  } = useOrganizationUsageQuery(
    {
      orgRef,
      start: dateRange.from,
      end: dateRange.to,
    },
    { enabled: !!orgRef }
  )

  const {
    data: perBranchUsage, 
    isLoading: perBranchUsageLoading,
    isError:perBranchUsageError,
    error:perBranchUsageErrorObj
  } = useOrganizationMeteringQuery({
    orgRef,
    start: dateRange.from,
    end: dateRange.to
  })  

  // orgUsage shape:
  // {
  //   milli_vcpu?: number | null
  //   ram?: number | null
  //   iops?: number | null
  //   storage_size?: number | null
  //   database_size?: number | null
  // }

const resourceStats: ResourceUsageMetric[] = useMemo(
  () => [
    {
      key: 'milli_vcpu',
      label: 'vCPU',
      value: orgUsage?.milli_vcpu ?? 0,
    },
    {
      key: 'ram',
      label: 'RAM',
      value: orgUsage?.ram ?? 0,
    },
    {
      key: 'database_size',
      label: 'Database',
      value: orgUsage?.database_size ?? 0,
    },
    {
      key: 'storage_size',
      label: 'Storage',
      value: orgUsage?.storage_size ?? 0,
    },
    {
      key: 'iops',
      label: 'IOPS',
      value: orgUsage?.iops ?? 0,
    },
  ],
  [orgUsage]
)


  const handleExport = () => {
    toast.success(
      `Preparing usage export (${exportFormat.toUpperCase()}) for ${dayjs(dateRange.from).format(
        'DD MMM YYYY'
      )} → ${dayjs(dateRange.to).format('DD MMM YYYY')}`
    )
    setExportModalOpen(false)
  }

  useEffect(() => {
    if (usageError && usageErrorObj) {
      toast.error(`Failed to load usage: ${usageErrorObj.message}`)
    }
  }, [usageError, usageErrorObj])

  return (
    <ScaffoldContainer bottomPadding className="py-6">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <ScaffoldTitle className="text-2xl font-semibold text-foreground">
              Metering
            </ScaffoldTitle>
            <p className="text-sm text-foreground-light">
              Analyze organization-wide resource consumption over a custom date range and export usage
              snapshots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LogsDatePicker
              hideWarnings
              value={dateRange}
              onSubmit={(value) => setDateRange(value)}
              helpers={[
                {
                  text: 'Last 24 hours',
                  calcFrom: () => dayjs().utc().subtract(1, 'day').toISOString(),
                  calcTo: () => dayjs().utc().toISOString(),
                },
                {
                  text: 'Last 7 days',
                  calcFrom: () => dayjs().utc().subtract(7, 'day').toISOString(),
                  calcTo: () => dayjs().utc().toISOString(),
                },
                {
                  text: 'Last 30 days',
                  calcFrom: () => dayjs().utc().subtract(30, 'day').toISOString(),
                  calcTo: () => dayjs().utc().toISOString(),
                },
              ]}
            />

            <Button
              size="small"
              icon={<Download size={16} />}
              type="default"
              onClick={() => setExportModalOpen(true)}  
            >
              Export
            </Button>
          </div>
        </div>

        {/* Stat cards fed directly from orgUsage */}
        <ResourceUsageStats metrics={resourceStats} loading={usageLoading} />

        <PerBranchUsageTable
          orgRef={orgRef}
          perBranchUsage={perBranchUsage}
          loading={perBranchUsageLoading}
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
