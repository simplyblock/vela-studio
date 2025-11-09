import React, { useMemo } from 'react'
import { useOrganizationLimitsQuery } from 'data/resources/organization-limits-query'
import { useOrganizationUsageQuery } from 'data/resources/organization-usage-query'
import { cn } from 'ui'

type Props = {
  orgRef?: string
}

type OrgLimitItem = {
  resource: 'milli_vcpu' | 'ram' | 'iops' | 'storage_size' | 'database_size'
  max_total: number | null
  max_per_branch: number | null
}

type OrgUsageShape = {
  milli_vcpu?: number | null | undefined
  ram?: number | null | undefined
  ram_bytes?: number | null | undefined
  iops?: number | null | undefined
  storage_size?: number | null | undefined
  storage_bytes?: number | null | undefined
  database_size?: number | null | undefined
  nvme_bytes?: number | null | undefined
}

/**
 * OrganizationResourcesPanel
 * Reads organization-wide limits (array) and usage (object) and renders rows.
 */
export default function OrganizationResourcesPanel({ orgRef }: Props) {
  const { data: limits, isLoading: loadingLimits } = useOrganizationLimitsQuery(
    { orgRef },
    { enabled: !!orgRef }
  )
  const { data: usage, isLoading: loadingUsage } = useOrganizationUsageQuery(
    { orgRef },
    { enabled: !!orgRef }
  )

  const loading = loadingLimits || loadingUsage

  // definitions: label, candidate keys for limits & usage, unit/divider and color
  const defs = useMemo(
    () => [
      {
        id: 'milli_vcpu',
        label: 'vCPU',
        maxCandidates: ['milli_vcpu'],
        usedCandidates: ['milli_vcpu'],
        unit: 'vCPU',
        divider: 1000,
        colorClass: 'bg-sky-500',
      },
      {
        id: 'ram',
        label: 'RAM',
        maxCandidates: ['ram', 'ram_bytes'],
        usedCandidates: ['ram', 'ram_bytes'],
        unit: 'GiB',
        divider: 1024 ** 3,
        colorClass: 'bg-amber-500',
      },
      {
        id: 'nvme',
        label: 'Database',
        maxCandidates: ['database_size', 'nvme_bytes'],
        usedCandidates: ['database_size', 'nvme_bytes'],
        unit: 'GB',
        divider: 1_000_000_000,
        colorClass: 'bg-violet-500',
      },
      {
        id: 'iops',
        label: 'IOPS',
        maxCandidates: ['iops'],
        usedCandidates: ['iops'],
        unit: 'IOPS',
        divider: 1,
        colorClass: 'bg-emerald-500',
      },
      {
        id: 'storage',
        label: 'Storage',
        maxCandidates: ['storage_size', 'storage_bytes'],
        usedCandidates: ['storage_size', 'storage_bytes'],
        unit: 'GB',
        divider: 1_000_000_000,
        colorClass: 'bg-sky-700',
      },
    ],
    []
  )

  const rows = useMemo(() => {
    // nothing loaded yet
    if (!limits && !usage) return []

    // helper: search limits array for resource candidate and return max_total (or null)
    const getLimitValue = (candidates: string[]): number | null => {
      if (!Array.isArray(limits)) return null
      for (const candidate of candidates) {
        const found = limits.find((l: OrgLimitItem) => l.resource === candidate)
        if (found && typeof found.max_total === 'number') return found.max_total
      }
      return null
    }

    // helper: read usage object by candidate keys
    const getUsageValue = (candidates: string[]): number | null => {
      if (!usage) return null
      for (const candidate of candidates) {
        const val = (usage as any)[candidate]
        if (typeof val === 'number') return val
      }
      return null
    }

    const fmt = (raw: number | null, unit: string, divider: number) => {
      if (raw == null) return '—'
      const v = raw / divider
      if (unit === 'GiB' || unit === 'GB') {
        return v < 10 ? `${v.toFixed(2)} ${unit}` : `${Math.round(v)} ${unit}`
      }
      if (unit === 'vCPU') {
        return v % 1 === 0 ? `${v.toFixed(0)} ${unit}` : `${v.toFixed(1)} ${unit}`
      }
      return raw.toLocaleString()
    }

    return defs
      .map((d) => {
        const maxRaw = getLimitValue(d.maxCandidates)
        const usedRaw = getUsageValue(d.usedCandidates)

        const maxNum = typeof maxRaw === 'number' ? maxRaw : null
        const usedNum = typeof usedRaw === 'number' ? usedRaw : 0

        const pct = maxNum && maxNum > 0 ? Math.min(100, Math.max(0, (usedNum / maxNum) * 100)) : null

        return {
          id: d.id,
          label: d.label,
          usedRaw: usedRaw == null ? null : usedNum,
          maxRaw: maxRaw == null ? null : maxNum,
          usedDisplay: fmt(usedRaw == null ? null : usedNum, d.unit, d.divider),
          maxDisplay: maxRaw == null ? 'unlimited' : fmt(maxRaw, d.unit, d.divider),
          pct,
          colorClass: d.colorClass,
        }
      })
      // hide rows that are entirely empty (no max and no usage)
      .filter((r) => r.usedRaw !== null || r.maxRaw !== null)
  }, [limits, usage, defs])

  const mostUsed = rows
    .slice()
    .filter((r) => r.pct != null)
    .sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0))[0] ?? null

  return (
    <div className="rounded-md border p-4 bg-surface-100">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-foreground">Organization usage</h3>
          <p className="text-xs text-foreground-muted">Quota & usage across the organization</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold">{loading ? '—' : mostUsed ? `${Math.round(mostUsed.pct ?? 0)}%` : '—'}</div>
          <div className="text-xs text-foreground-muted">{loading ? 'Loading' : mostUsed ? mostUsed.label : 'No data'}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-1 text-xs text-foreground-muted">Loading limits & usage…</div>
        ) : rows.length === 0 ? (
          <div className="col-span-1 text-xs text-foreground-muted">No resource information available.</div>
        ) : (
          rows.map((r) => {
            const pct = r.pct ?? 0
            const hasMax = r.maxRaw != null
            return (
              <div key={r.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-foreground">{r.label}</div>
                  <div className="text-xs text-foreground-muted">
                    {r.usedDisplay} / {r.maxDisplay}
                  </div>
                </div>

                <div className="w-full h-2 rounded bg-surface-200 overflow-hidden">
                  <div className={cn('h-full transition-all duration-200', r.colorClass)} style={{ width: `${pct}%` }} />
                </div>

                {r.pct != null ? (
                  <div className="text-xs text-foreground-muted mt-1">{Math.round(r.pct)}%</div>
                ) : (
                  <div className="text-xs text-foreground-muted mt-1">Unlimited / not bounded</div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
