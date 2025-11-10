// components/interfaces/Branch/BranchStatusBadge.tsx
import React from 'react'
import { CheckCircle, Play, Loader2, AlertTriangle, XCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent, cn } from 'ui'

export type BranchSystemStatus =
  | 'ACTIVE_HEALTHY'
  | 'STOPPED'
  | 'STARTING'
  | 'ACTIVE_UNHEALTHY'
  | 'CREATING'
  | 'DELETING'
  | 'UPDATING'
  | 'RESTARTING'
  | 'STOPPING'
  | 'UNKNOWN'
  | 'ERROR'

export const TRANSITIONAL: BranchSystemStatus[] = [
  'STARTING',
  'CREATING',
  'DELETING',
  'UPDATING',
  'RESTARTING',
  'STOPPING',
]

const ACTIVE: BranchSystemStatus[] = ['ACTIVE_HEALTHY', 'ACTIVE_UNHEALTHY']

type Props = {
  status?: string | null
  className?: string
  // optional small size flag (for tight UIs)
  size?: 'sm' | 'md'
}

/**
 * BranchStatusBadge
 *
 * A compact chip-like badge showing a branch system status with icon + tooltip.
 */
export default function BranchStatusBadge({ status, className, size = 'md' }: Props) {
  const s = (status ?? 'UNKNOWN') as BranchSystemStatus

  // visual defaults
  let label = s as string
  let icon: React.ReactNode = null
  let tone = 'neutral' // used to map to classes below
  let tooltipTitle = label
  let tooltipBody: React.ReactNode = null

  if (ACTIVE.includes(s)) {
    // ACTIVE_HEALTHY or ACTIVE_UNHEALTHY
    const healthy = s === 'ACTIVE_HEALTHY'
    label = healthy ? 'Active' : 'Active (unhealthy)'
    icon = <CheckCircle size={14} />
    tone = healthy ? 'success' : 'warning'
    tooltipTitle = healthy ? 'Branch active' : 'Branch active (unhealthy)'
    tooltipBody = healthy
      ? 'Branch is running normally.'
      : 'Branch is running but flagged unhealthy — check logs or resource warnings.'
  } else if (s === 'STOPPED') {
    label = 'Stopped'
    icon = <Play size={14} />
    tone = 'muted'
    tooltipTitle = 'Branch stopped'
    tooltipBody = 'Branch is currently stopped. Start it to open the branch.'
  } else if (TRANSITIONAL.includes(s)) {
    label = 'Working…'
    icon = <Loader2 size={14} className="animate-spin" />
    tone = 'accent'
    tooltipTitle = 'Operation in progress'
    tooltipBody = 'The branch is currently provisioning or updating. Please wait until the operation finishes.'
  } else if (s === 'ACTIVE_UNHEALTHY') {
    label = 'Unhealthy'
    icon = <AlertTriangle size={14} />
    tone = 'warning'
    tooltipTitle = 'Branch unhealthy'
    tooltipBody = 'Branch is running but unhealthy. Investigate logs and metrics.'
  } else if (s === 'UNKNOWN' || s === 'ERROR') {
    label = s === 'UNKNOWN' ? 'Unknown' : 'Error'
    icon = <XCircle size={14} />
    tone = 'danger'
    tooltipTitle = tooltipTitle
    tooltipBody = s === 'UNKNOWN' ? 'Branch status unknown.' : 'Branch has encountered an error. Check the activity and logs.'
  } else {
    // fallback
    label = s
    icon = null
    tone = 'neutral'
    tooltipTitle = label
    tooltipBody = null
  }

  // map tone to classes (uses your project tokens / tailwind utility patterns)
  const toneMap: Record<string, string> = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    danger: 'bg-destructive-100 text-destructive-700 border border-destructive-200',
    accent: 'bg-amber-50 text-amber-800 border border-amber-100',
    muted: 'bg-surface-300 text-foreground border border-default',
    neutral: 'bg-surface-300 text-foreground border border-default',
  }

  const sizeMap: Record<'sm' | 'md', { pad: string; text: string }> = {
    sm: { pad: 'px-2 py-0.5', text: 'text-[11px]' },
    md: { pad: 'px-2.5 py-0.5', text: 'text-sm' },
  }

  const { pad, text } = sizeMap[size]

  const chip = (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium shadow-sm select-none',
        pad,
        text,
        'leading-none',
        toneMap[tone] ?? toneMap.neutral,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  )

  // If there is tooltip content, wrap in Tooltip; else just return chip
  if (tooltipBody) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{chip}</TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-xs">
          <div className="space-y-1">
            <div className="text-sm font-medium">{tooltipTitle}</div>
            <div className="text-xs text-foreground-muted">{tooltipBody}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return chip
}
