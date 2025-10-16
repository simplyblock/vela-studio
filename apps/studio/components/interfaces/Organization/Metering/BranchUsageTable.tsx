import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Listbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from 'ui'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
} from 'lucide-react'

import type { BranchUsageRow, SortConfig, SortableColumn } from './types'
import { formatHours, formatInteger } from './utils'

const tableColumns: Array<{ key: SortableColumn; label: string; numeric?: boolean }> = [
  { key: 'project', label: 'Project' },
  { key: 'branch', label: 'Branch' },
  { key: 'environment', label: 'Environment' },
  { key: 'vCpuHours', label: 'vCPU Hours', numeric: true },
  { key: 'ramHours', label: 'RAM Hours', numeric: true },
  { key: 'iopsHours', label: 'IOPS Hours', numeric: true },
  { key: 'dbStorageHours', label: 'DB Storage Hours', numeric: true },
  { key: 'storageHours', label: 'Storage Hours', numeric: true },
  { key: 'totalRuntime', label: 'Total Runtime', numeric: true },
]

const PAGE_SIZE_OPTIONS = [10, 20, 30, 40]

interface BranchUsageTableProps {
  rows: BranchUsageRow[]
  sortConfig: SortConfig
  onSort: (column: SortableColumn) => void
  page: number
  pageCount: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const BranchUsageTable = ({
  rows,
  sortConfig,
  onSort,
  page,
  pageCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: BranchUsageTableProps) => {
  const renderSortIcon = (column: SortableColumn) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown size={14} className="text-foreground-light" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={14} className="text-foreground" />
    ) : (
      <ArrowDown size={14} className="text-foreground" />
    )
  }

  return (
    <Card className="p-0">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-medium text-foreground">Per-branch resource hours</h3>
        <p className="text-sm text-foreground-light">
          Drill into resource consumption by branch and environment to validate projections against
          billing.
        </p>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead key={column.key} className={column.numeric ? 'text-right' : ''}>
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-foreground-light',
                        column.numeric ? 'ml-auto' : 'justify-start'
                      )}
                    >
                      <span>{column.label}</span>
                      {renderSortIcon(column.key)}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">{row.project}</TableCell>
                  <TableCell className="text-foreground-light">{row.branch}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {row.environment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInteger(row.vCpuHours)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInteger(row.ramHours)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInteger(row.iopsHours)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInteger(row.dbStorageHours)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatInteger(row.storageHours)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-foreground">
                    {formatHours(row.totalRuntime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-border px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground-light">Rows per page</span>
          <Listbox
            size="tiny"
            value={pageSize.toString()}
            onChange={(value: string) => onPageSizeChange(Number(value))}
            buttonClassName="w-[120px]"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <Listbox.Option
                key={size}
                id={`page-size-${size}`}
                value={size.toString()}
                label={`${size} rows`}
              >
                {size} rows
              </Listbox.Option>
            ))}
          </Listbox>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-foreground-light">
            Page {page + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="default"
              size="tiny"
              onClick={() => onPageChange(Math.max(page - 1, 0))}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ArrowLeft size={14} />
            </Button>
            <Button
              type="default"
              size="tiny"
              onClick={() => onPageChange(Math.min(page + 1, pageCount - 1))}
              disabled={page + 1 >= pageCount}
              aria-label="Next page"
            >
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default BranchUsageTable
