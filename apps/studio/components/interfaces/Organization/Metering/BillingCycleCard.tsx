import { type ComponentProps } from 'react'
import { Badge, Card, CardContent } from 'ui'

import type { BillingCycle, BillingStatus, ExportFormat } from './types'
import { formatInteger, formatPeriod } from './utils'

const statusVariant: Record<BillingStatus, ComponentProps<typeof Badge>['variant']> = {
  Current: 'success',
  Closed: 'default',
  Upcoming: 'warning',
}

interface BillingCycleCardProps {
  cycle: BillingCycle
  exportFormat: ExportFormat
}

const BillingCycleCard = ({ cycle, exportFormat }: BillingCycleCardProps) => {
  return (
    <Card className="p-0">
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {`Billing Cycle: ${cycle.month} ${cycle.year}`}
            </h2>
            <p className="text-sm text-foreground-light">
              Usage totals across all projects for the selected billing period.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-foreground-light">Status</span>
              <Badge variant={statusVariant[cycle.status]} className="capitalize">
                {cycle.status.toLowerCase()}
              </Badge>
            </div>
            <span className="text-sm text-foreground-light">
              {formatPeriod(cycle.start, cycle.end)}
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-border bg-surface-100 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground-light">Period</dt>
            <dd className="text-base font-semibold text-foreground">
              {formatPeriod(cycle.start, cycle.end)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-100 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground-light">
              Active Projects
            </dt>
            <dd className="text-base font-semibold text-foreground">
              {formatInteger(cycle.activeProjects)}
            </dd>
          </div>
          <div className="rounded-lg border border-border bg-surface-100 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground-light">
              Total Runtime Hours
            </dt>
            <dd className="text-base font-semibold text-foreground">
              {formatInteger(cycle.totalRuntimeHours)}
            </dd>
          </div>
          {/* <div className="rounded-lg border border-border bg-surface-100 p-4">
            <dt className="text-xs font-medium uppercase tracking-wide text-foreground-light">
              Next Export Format
            </dt>
            <dd className="text-base font-semibold text-foreground">{exportFormat.toUpperCase()}</dd>
          </div> */}
        </dl>
      </CardContent>
    </Card>
  )
}

export default BillingCycleCard
