import React, { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, cn } from 'ui' // adjust if needed

type ResourceNumbers = {
  milli_vcpu?: number | null
  ram_bytes?: number | null
  nvme_bytes?: number | null
  iops?: number | null
  storage_bytes?: number | null
}

const RESOURCE_ORDER: { key: keyof ResourceNumbers; label: string; unit: 'vCPU' | 'GiB' | 'GB' | 'IOPS' }[] =
  [
    { key: 'milli_vcpu', label: 'vCPU', unit: 'vCPU' },
    { key: 'ram_bytes', label: 'RAM', unit: 'GiB' },
    { key: 'nvme_bytes', label: 'Database', unit: 'GB' },
    { key: 'iops', label: 'IOPS', unit: 'IOPS' },
    { key: 'storage_bytes', label: 'Storage', unit: 'GB' },
  ]

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function formatBytesToGB(bytes: number | null | undefined) {
  if (bytes == null) return '—'
  // show GB with no decimals for large numbers, or 2 decimals if < 10
  const gb = bytes / 1_000_000_000
  return gb < 10 ? `${gb.toFixed(2)} GB` : `${Math.round(gb)} GB`
}

function formatBytesToGiB(bytes: number | null | undefined) {
  if (bytes == null) return '—'
  const gib = bytes / (1024 ** 3)
  return gib < 10 ? `${gib.toFixed(2)} GiB` : `${Math.round(gib)} GiB`
}

function formatNumber(n: number | null | undefined) {
  if (n == null) return '—'
  return n.toLocaleString()
}

/**
 * Circular progress + tooltip showing per-resource linear bars.
 *
 * Props:
 *  - max_resources, used_resources: objects like you pasted in prompt
 */
export const BranchResourceBadge = ({
  max_resources,
  used_resources,
  size = 36,
}: {
  max_resources?: ResourceNumbers | null
  used_resources?: ResourceNumbers | null
  size?: number
}) => {
  // build the list of resource rows with computed percent and display strings
  const rows = useMemo(() => {
    const out: {
      key: keyof ResourceNumbers
      label: string
      percent: number
      usedDisplay: string
      maxDisplay: string
    }[] = []

    if (!max_resources && !used_resources) return out

    for (const r of RESOURCE_ORDER) {
      const k = r.key
      const maxRaw = (max_resources as any)?.[k] ?? null
      const usedRaw = (used_resources as any)?.[k] ?? null

      // skip resources with no max and no used
      if (maxRaw == null && usedRaw == null) continue

      // For milli_vcpu: API uses millis, convert to vCPU (divide by 1000)
      if (k === 'milli_vcpu') {
        const max = typeof maxRaw === 'number' ? maxRaw / 1000 : null
        const used = typeof usedRaw === 'number' ? usedRaw / 1000 : 0
        const percent = max ? clamp((used / max) * 100) : 0
        out.push({
          key: k,
          label: r.label,
          percent,
          usedDisplay: used === 0 ? '0 vCPU' : `${used % 1 === 0 ? used.toFixed(0) : used.toFixed(1)} vCPU`,
          maxDisplay: max == null ? '—' : `${max % 1 === 0 ? max.toFixed(0) : max.toFixed(1)} vCPU`,
        })
        continue
      }

      // For RAM we show GiB
      if (k === 'ram_bytes') {
        const max = typeof maxRaw === 'number' ? maxRaw : null
        const used = typeof usedRaw === 'number' ? usedRaw : 0
        const percent = max ? clamp((used / max) * 100) : 0
        out.push({
          key: k,
          label: r.label,
          percent,
          usedDisplay: formatBytesToGiB(used),
          maxDisplay: formatBytesToGiB(max),
        })
        continue
      }

      // For storage / nvme we show GB (using decimal GB)
      if (k === 'nvme_bytes' || k === 'storage_bytes') {
        const max = typeof maxRaw === 'number' ? maxRaw : null
        const used = typeof usedRaw === 'number' ? usedRaw : 0
        const percent = max ? clamp((used / max) * 100) : 0
        out.push({
          key: k,
          label: r.label,
          percent,
          usedDisplay: formatBytesToGB(used),
          maxDisplay: formatBytesToGB(max),
        })
        continue
      }

      // Fallback numeric (iops)
      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0
      const percent = max ? clamp((used / max) * 100) : 0
      out.push({
        key: k,
        label: r.label,
        percent,
        usedDisplay: formatNumber(used),
        maxDisplay: formatNumber(max),
      })
    }

    return out
  }, [max_resources, used_resources])

  // find most used resource
  const mostUsed = useMemo(() => {
    if (!rows || rows.length === 0) return null
    // sort by percent desc, prefer first in order if tie
    const sorted = [...rows].sort((a, b) => b.percent - a.percent)
    return sorted[0]
  }, [rows])

  // SVG circle geometry
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = mostUsed ? clamp(mostUsed.percent) : 0
  const dash = (circumference * pct) / 100
  const remaining = circumference - dash

  // color by resource key for quick visual identification
  const resourceColor = (key?: string) => {
    switch (key) {
      case 'milli_vcpu':
        return 'text-brand-600' // blue-ish
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
                {/* background circle */}
                <circle
                  r={radius}
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={stroke}
                />
                {/* foreground */}
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

            {/* center label: percent */}
            <div
              className="absolute inset-0 flex items-center justify-center text-[11px] font-medium"
              style={{ pointerEvents: 'none' }}
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
              const keyLabel = r.label
              const percent = Math.round(r.percent)
              return (
                <div key={String(r.key)} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[12px]">{keyLabel}</span>
                      <span className="text-foreground-muted text-[11px]">({r.usedDisplay})</span>
                    </div>
                    <div className="text-[11px] text-foreground-muted">{r.maxDisplay}</div>
                  </div>

                  {/* simple linear progress */}
                  <div className="w-full h-2 rounded bg-surface-200 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={cn(
                        'h-full',
                        resourceColor(r.key as string),
                        'transition-all duration-200'
                      )}
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
