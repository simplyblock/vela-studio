import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'

import DatabaseBackupsNav from '../DatabaseBackupsNav'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchBackupSchedulesQuery } from 'data/backups/branch-backup-schedules-query'
import { useParams } from 'common'
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import BranchScheduleModal from './BranchScheduleModal'

type NormalizedScheduleRow = {
  id: string
  rowIndex: number
  every: number
  unit: string
  retention: number
}

type NormalizedSchedule = {
  id: string
  environment: string
  rows: NormalizedScheduleRow[]
}

const toArray = <T,>(value: T | T[] | undefined | null) =>
  Array.isArray(value) ? value : value ? [value] : []

const capitalize = (value: string) =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1)

const formatUnit = (unit: string, every: number) => {
  const safeUnit = unit.toLowerCase()
  if (every === 1) return safeUnit.replace(/s$/, '')
  if (safeUnit.endsWith('s')) return safeUnit
  return `${safeUnit}s`
}

const normalizeSchedules = (data: any): NormalizedSchedule[] => {
  const schedules = toArray<any>(data)
  return schedules
    .map((item, index) => {
      const rows = toArray<any>(item?.rows)
        .map((row: any, rowIndex: number) => ({
          id: `${item?.id ?? index}-${row?.row_index ?? rowIndex}`,
          rowIndex: Number(row?.row_index ?? rowIndex),
          every: Number(row?.interval ?? row?.every ?? 0),
          unit: String(row?.unit ?? 'hours'),
          retention: Number(row?.retention ?? row?.repeat ?? 0),
        }))
        .filter((row) => row.every > 0)
        .sort((a, b) => a.rowIndex - b.rowIndex)

      return {
        id: String(item?.id ?? `schedule-${index}`),
        environment: String(item?.env_type ?? item?.environment ?? 'all'),
        rows,
      }
    })
    .filter((item) => item.rows.length > 0)
}

const BranchBackupSchedules = () => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
  } = useBranchBackupSchedulesQuery(
    { orgId, projectId, branchId },
    { enabled: Boolean(orgId && projectId && branchId) }
  )

  const schedules = useMemo(() => normalizeSchedules(data), [data])

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="scheduled" />

            {isError ? (
              <AlertError subject="Failed to load backup schedules" error={error} />
            ) : (
              <Card>
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <CardTitle>Automated backup schedules</CardTitle>
                    <p className="text-sm text-foreground-light">
                      Review the automated backup cadence configured for this branch.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {(isLoading || isFetching) && (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground-light" />
                    )}
                    <BranchScheduleModal />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <GenericSkeletonLoader />
                  ) : schedules.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border bg-transparent px-4 py-10 text-center text-sm text-foreground-light">
                      No automated backup schedule is configured for this branch.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {schedules.map((schedule) => (
                        <div key={schedule.id} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">Environment</span>
                            <Badge variant="outline">
                              {schedule.environment === 'all'
                                ? 'All environments'
                                : capitalize(schedule.environment)}
                            </Badge>
                          </div>
                          <div className="overflow-hidden rounded-lg border border-border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-1/3">Frequency</TableHead>
                                  <TableHead className="w-1/3">Retention</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {schedule.rows.map((row) => (
                                  <TableRow key={row.id}>
                                    <TableCell className="text-sm text-foreground">
                                      Every {row.every} {formatUnit(row.unit, row.every)}
                                    </TableCell>
                                    <TableCell className="text-sm text-foreground-light">
                                      Retains {row.retention} backup{row.retention === 1 ? '' : 's'}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default BranchBackupSchedules
