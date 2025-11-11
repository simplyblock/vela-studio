// components/interfaces/Branch/BranchResourceBadge.tsx
import React, { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, cn } from 'ui'
import { formatForUnit, getDivider } from './utils'


type ResourceNumbers = {
  milli_vcpu?: number | null
  ram_bytes?: number | null
  nvme_bytes?: number | null
  iops?: number | null
  storage_bytes?: number | null
}

const RESOURCE_ORDER: { key: keyof ResourceNumbers; label: string; unitKey: string }[] = [
  { key: 'milli_vcpu', label: 'vCPU', unitKey: 'milli_vcpu' },
  { key: 'ram_bytes', label: 'RAM', unitKey: 'ram_bytes' },
  { key: 'nvme_bytes', label: 'Database', unitKey: 'nvme_bytes' },
  { key: 'iops', label: 'IOPS', unitKey: 'iops' },
  { key: 'storage_bytes', label: 'Storage', unitKey: 'storage_bytes' },
]

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

export const BranchResourceBadge = ({
  max_resources,
  used_resources,
  size = 36,
}: {
  max_resources?: ResourceNumbers | null
  used_resources?: ResourceNumbers | null
  size?: number
}) => {
  const rows = useMemo(() => {
    const out: {
      key: keyof ResourceNumbers
      label: string
      percent: number
      usedDisplay: string
      maxDisplay: string
      unitKey: string
    }[] = []

    if (!max_resources && !used_resources) return out

    for (const r of RESOURCE_ORDER) {
      const k = r.key
      const unitKey = r.unitKey
      const maxRaw = (max_resources as any)?.[k] ?? null
      const usedRaw = (used_resources as any)?.[k] ?? null

      if (maxRaw == null && usedRaw == null) continue

      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0

      // convert using shared divider logic and format using helper
      const maxDisplay = formatForUnit(max, unitKey)
      const usedDisplay = formatForUnit(used, unitKey)

      // compute percent on raw numbers but with divider to match units
      const divider = getDivider(unitKey)
      const maxNum = max != null ? max / divider : null
      const usedNum = used / divider
      const percent = maxNum ? clamp((usedNum / maxNum) * 100) : 0

      out.push({
        key: k,
        label: r.label,
        percent,
        usedDisplay,
        maxDisplay,
        unitKey,
      })
    }

    return out
  }, [max_resources, used_resources])

  const mostUsed = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const sorted = [...rows].sort((a, b) => b.percent - a.percent)
    return sorted[0]
  }, [rows])

  // SVG geometry: wider stroke and slightly smaller center label
  const stroke = 8 // increased from 6
  const radius = Math.max(3, (size - stroke) / 2)
  const circumference = 2 * Math.PI * radius
  const pct = mostUsed ? clamp(mostUsed.percent) : 0
  const dash = (circumference * pct) / 100
  const remaining = Math.max(0, circumference - dash)

  const resourceColor = (key?: string) => {
    switch (key) {
      case 'milli_vcpu':
        return 'text-brand-600'
      case 'ram_bytes':
        return 'text-amber-600'
      case 'nvme_bytes':
        return 'text-violet-600'
      case 'iops':
        return 'text-emerald-600'
      case 'storage_bytes':
        return 'text-sky-600'
      default:
        return 'text-foreground'
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={
            mostUsed
              ? `${mostUsed.label} usage ${Math.round(mostUsed.percent)}%`
              : 'No resource usage info'
          }
          className="inline-flex items-center gap-2 p-0 bg-transparent border-0"
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="block">
              <g transform={`translate(${size / 2}, ${size / 2})`}>
                <circle r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
                <circle
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${remaining}`}
                  transform={`rotate(-90)`}
                  className={resourceColor(mostUsed?.key as string)}
                  style={{ transition: 'stroke-dasharray 240ms ease' }}
                />
              </g>
            </svg>

            {/* center label smaller to avoid overlap at 100% */}
            <div
              className="absolute inset-0 flex items-center justify-center font-medium"
              style={{ pointerEvents: 'none', fontSize: 10 }}
            >
              {mostUsed ? `${Math.round(mostUsed.percent)}%` : '—'}
            </div>
          </div>
        </button>
      </TooltipTrigger>

      <TooltipContent side="top" align="center" className="min-w-[220px] p-3">
        <div className="space-y-2">
          <div className="text-xs text-foreground-muted">Resource usage</div>

          {rows.length === 0 ? (
            <div className="text-sm text-foreground-light">No resource info available</div>
          ) : (
            rows.map((r) => {
              const percent = Math.round(r.percent)
              return (
                <div key={String(r.key)} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[12px]">{r.label}</span>
                      <span className="text-foreground-muted text-[11px]">({r.usedDisplay})</span>
                    </div>
                    <div className="text-[11px] text-foreground-muted">{r.maxDisplay}</div>
                  </div>

                  <div className="w-full h-2 rounded bg-surface-200 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={cn('h-full', resourceColor(r.key as string), 'transition-all duration-200')}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
