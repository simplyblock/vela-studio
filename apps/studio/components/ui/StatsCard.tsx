import React from 'react'
import { cn } from 'ui'

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  className?: string
}

const StatsCard = React.forwardRef<HTMLDivElement, StatsCardProps>(
  ({ title, value, description, icon, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-lg border bg-surface-100 text-card-foreground shadow-md hover:shadow-lg transition-shadow p-6',
          className
        )}
        {...props}
      >
        {/* Header with title and icon (justified between) */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground-light">{title}</h3>
          <div className="text-foreground-light">{icon}</div>
        </div>

        {/* Big bold number */}
        <div className="text-3xl font-bold text-foreground mb-2">{value}</div>

        {/* Description with faded text */}
        <p className="text-sm text-foreground-light opacity-75">{description}</p>
      </div>
    )
  }
)

StatsCard.displayName = 'StatsCard'

export { StatsCard }
