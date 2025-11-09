import React, { useMemo } from 'react'
import { Tooltip, TooltipTrigger, TooltipContent, cn } from 'ui'
import { useProjectLimitsQuery } from 'data/resources/project-limits-query'
import { useProjectUsageQuery } from 'data/resources/project-usage-query'

type ProjectLimitsItem = {
  resource: 'milli_vcpu' | 'ram' | 'iops' | 'storage_size' | 'database_size'
  max_total: number
  max_per_branch: number
}

/**
 * Accepts either fetched data or will fetch itself if orgRef + projectRef are provided.
 * You can call with either:
 *   <ProjectResourcesBadge orgRef={orgRef} projectRef={projectRef} />
 * or
 *   <ProjectResourcesBadge projectLimits={...} projectUsage={...} />
 */
export const ProjectResourcesBadge = ({
  orgRef,
  projectRef,
  projectLimits,
  projectUsage,
  size = 36,
}: {
  orgRef?: string
  projectRef?: string
  projectLimits?: ProjectLimitsItem[] | undefined
  projectUsage?: {
    milli_vcpu?: number | null | undefined
    ram?: number | null | undefined
    iops?: number | null | undefined
    storage_size?: number | null | undefined
    database_size?: number | null | undefined
  } | undefined
  size?: number
}) => {
  // optionally fetch if not provided
  const limitsQuery = useProjectLimitsQuery(
    { orgRef: orgRef!, projectRef: projectRef! },
    { enabled: !projectLimits && !!orgRef && !!projectRef }
  )
  const usageQuery = useProjectUsageQuery(
    { orgRef: orgRef!, projectRef: projectRef! },
    { enabled: !projectUsage && !!orgRef && !!projectRef }
  )

  const limitsData: ProjectLimitsItem[] | undefined = projectLimits ?? (limitsQuery.data as any)
  const usageData = projectUsage ?? (usageQuery.data as any)

  // derive rows same as BranchResourceBadge expects (label + percent + usedDisplay + maxDisplay)
  const rows = useMemo(() => {
    if (!limitsData && !usageData) return []

    // helper to find max_total for a given resource key
    const findMax = (resourceName: string) => {
      if (!limitsData) return null
      const found = limitsData.find((x) => x.resource === resourceName)
      return found ? found.max_total : null
    }

    const out: {
      key: string
      label: string
      percent: number
      usedDisplay: string
      maxDisplay: string
    }[] = []

    // milli_vcpu -> vCPU
    {
      const maxRaw = findMax('milli_vcpu')
      const usedRaw = (usageData as any)?.milli_vcpu ?? 0
      const max = typeof maxRaw === 'number' ? maxRaw / 1000 : null
      const used = typeof usedRaw === 'number' ? usedRaw / 1000 : 0
      const percent = max ? Math.max(0, Math.min(100, (used / max) * 100)) : 0
      out.push({
        key: 'milli_vcpu',
        label: 'vCPU',
        percent,
        usedDisplay: used === 0 ? '0 vCPU' : `${used % 1 === 0 ? used.toFixed(0) : used.toFixed(1)} vCPU`,
        maxDisplay: max == null ? '—' : `${max % 1 === 0 ? max.toFixed(0) : max.toFixed(1)} vCPU`,
      })
    }

    // ram -> GiB (API field 'ram' expected to be bytes)
    {
      const maxRaw = findMax('ram')
      const usedRaw = (usageData as any)?.ram ?? 0
      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0
      const percent = max ? Math.max(0, Math.min(100, (used / max) * 100)) : 0
      const formatGiB = (b: number | null | undefined) => {
        if (b == null) return '—'
        const gib = b / (1024 ** 3)
        return gib < 10 ? `${gib.toFixed(2)} GiB` : `${Math.round(gib)} GiB`
      }
      out.push({
        key: 'ram',
        label: 'RAM',
        percent,
        usedDisplay: formatGiB(used),
        maxDisplay: formatGiB(max),
      })
    }

    // database_size -> GB (decimal GB)
    {
      const maxRaw = findMax('database_size')
      const usedRaw = (usageData as any)?.database_size ?? 0
      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0
      const percent = max ? Math.max(0, Math.min(100, (used / max) * 100)) : 0
      const formatGB = (b: number | null | undefined) => {
        if (b == null) return '—'
        const gb = b / 1_000_000_000
        return gb < 10 ? `${gb.toFixed(2)} GB` : `${Math.round(gb)} GB`
      }
      out.push({
        key: 'database_size',
        label: 'Database',
        percent,
        usedDisplay: formatGB(used),
        maxDisplay: formatGB(max),
      })
    }

    // storage_size -> GB
    {
      const maxRaw = findMax('storage_size')
      const usedRaw = (usageData as any)?.storage_size ?? 0
      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0
      const percent = max ? Math.max(0, Math.min(100, (used / max) * 100)) : 0
      const formatGB = (b: number | null | undefined) => {
        if (b == null) return '—'
        const gb = b / 1_000_000_000
        return gb < 10 ? `${gb.toFixed(2)} GB` : `${Math.round(gb)} GB`
      }
      out.push({
        key: 'storage_size',
        label: 'Storage',
        percent,
        usedDisplay: formatGB(used),
        maxDisplay: formatGB(max),
      })
    }

    // iops -> numeric
    {
      const maxRaw = findMax('iops')
      const usedRaw = (usageData as any)?.iops ?? 0
      const max = typeof maxRaw === 'number' ? maxRaw : null
      const used = typeof usedRaw === 'number' ? usedRaw : 0
      const percent = max ? Math.max(0, Math.min(100, (used / max) * 100)) : 0
      const formatNum = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString())
      out.push({
        key: 'iops',
        label: 'IOPS',
        percent,
        usedDisplay: formatNum(used),
        maxDisplay: formatNum(max),
      })
    }

    // filter out any resource with neither max nor used (optional)
    return out.filter((r) => r.maxDisplay !== '—' || r.usedDisplay !== '—')
  }, [limitsData, usageData])

  const mostUsed = useMemo(() => {
    if (!rows || rows.length === 0) return null
    const sorted = [...rows].sort((a, b) => b.percent - a.percent)
    return sorted[0]
  }, [rows])

  // SVG circle geometry
  const stroke = 6
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = mostUsed ? Math.max(0, Math.min(100, mostUsed.percent)) : 0
  const dash = (circumference * pct) / 100
  const remaining = circumference - dash

  // color mapping (same idea as branch badge)
  const resourceColor = (key?: string) => {
    switch (key) {
      case 'milli_vcpu':
        return 'text-brand-600'
      case 'ram':
        return 'text-amber-600'
      case 'database_size':
        return 'text-violet-600'
      case 'iops':
        return 'text-emerald-600'
      case 'storage_size':
        return 'text-sky-600'
      default:
        return 'text-foreground'
    }
  }

  // loading / no-data states
  const loading = (!projectLimits && limitsQuery.isLoading) || (!projectUsage && usageQuery.isLoading)
  const empty = rows.length === 0 && !loading

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={mostUsed ? `${mostUsed.label} usage ${Math.round(mostUsed.percent)}%` : 'No usage info'}
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
                  className={resourceColor(mostUsed?.key)}
                  style={{ transition: 'stroke-dasharray 240ms ease' }}
                />
              </g>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-medium" style={{ pointerEvents: 'none' }}>
              {loading ? '…' : empty ? '—' : `${Math.round(pct)}%`}
            </div>
          </div>
        </button>
      </TooltipTrigger>

      <TooltipContent side="top" align="center" className="min-w-[240px] p-3">
        <div className="space-y-2">
          <div className="text-xs text-foreground-muted">Project resource usage</div>

          {loading ? (
            <div className="text-sm text-foreground-light">Loading usage…</div>
          ) : empty ? (
            <div className="text-sm text-foreground-light">No resource info available</div>
          ) : (
            rows.map((r) => {
              const percent = Math.round(r.percent)
              return (
                <div key={r.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[12px]">{r.label}</span>
                      <span className="text-foreground-muted text-[11px]">({r.usedDisplay})</span>
                    </div>
                    <div className="text-[11px] text-foreground-muted">{r.maxDisplay}</div>
                  </div>

                  <div className="w-full h-2 rounded bg-surface-200 overflow-hidden">
                    <div style={{ width: `${percent}%` }} className={cn('h-full', resourceColor(r.key), 'transition-all duration-200')} />
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

export default ProjectResourcesBadge
