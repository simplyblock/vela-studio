import { StatsCard } from 'components/ui/StatsCard'

import type { ResourceMetricDefinition } from './types'
import { formatCompactNumber } from './utils'

interface ResourceUsageStatsProps {
  metrics: Array<ResourceMetricDefinition & { value: number }>
}

const ResourceUsageStats = ({ metrics }: ResourceUsageStatsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-foreground">Resource usage summary</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <StatsCard
            key={metric.key}
            title={metric.label}
            value={formatCompactNumber(metric.value)}
            description={`Average monthly usage ${formatCompactNumber(metric.value)} ${metric.summarySuffix}`}
            icon={metric.icon}
          />
        ))}
      </div>
    </div>
  )
}

export default ResourceUsageStats
