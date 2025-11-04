import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ScaffoldContainer } from 'components/layouts/Scaffold'
import {
  Card,
  Button,
  Input_Shadcn_,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'ui'

import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useOrganizationUpdateMutation } from 'data/organizations/organization-update-mutation'
import { organizationKeys } from 'data/organizations/keys'
import type { components } from 'data/api'

type OrgDetail = components['schemas']['OrganizationSlugResponse']

const PRESETS = ['Production', 'Staging', 'Test', 'Development'] as const
const PRESET_COLOR: Record<(typeof PRESETS)[number], string> = {
  Production: 'bg-emerald-500',
  Staging: 'bg-amber-500',
  Test: 'bg-purple-500',
  Development: 'bg-sky-500',
}

const hasSpaces = (s: string) => /\s/.test(s)

const Environments = () => {
  const queryClient = useQueryClient()
  const { data: org } = useSelectedOrganizationQuery()

  const slug = org?.id
  const originalEnvTypes = useMemo<string[]>(
    () => (Array.isArray(org?.env_types) ? [...(org!.env_types as string[])] : []),
    [org?.env_types]
  )

  const [items, setItems] = useState<string[]>(originalEnvTypes)
  const [draft, setDraft] = useState('')
  const [isDirty, setDirty] = useState(false)

  // For delete confirmation
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null)

  useEffect(() => {
    setItems(originalEnvTypes)
    setDraft('')
    setDirty(false)
    setPendingDeleteIndex(null)
  }, [originalEnvTypes.join('|')])

  const mutation = useOrganizationUpdateMutation({
    onSuccess: () => {
      if (!slug) return
      // Patch caches so UI reflects new env_types immediately
      queryClient.setQueriesData(
        { queryKey: organizationKeys.detail(slug), exact: true },
        (prev: OrgDetail | undefined) => (prev ? { ...prev, env_types: items } : prev)
      )
      queryClient.setQueriesData(
        { queryKey: organizationKeys.list(), exact: true },
        (prev: components['schemas']['OrganizationResponse'][] | undefined) =>
          Array.isArray(prev)
            ? prev.map((o) => (o.slug === slug ? { ...o, env_types: items as any } : o))
            : prev
      )
      setDirty(false)
      toast.success('Environment types updated')
    },
  })

  const addItem = () => {
    const value = draft.trim()
    if (!value) return
    const lower = items.map((s) => s.toLowerCase())
    if (lower.includes(value.toLowerCase())) {
      toast.error('Environment already exists')
      return
    }
    setItems((prev) => [...prev, value])
    setDraft('')
    setDirty(true)
  }

  const addPreset = (name: (typeof PRESETS)[number]) => {
    const lower = items.map((s) => s.toLowerCase())
    if (lower.includes(name.toLowerCase())) {
      toast.message(`${name} already added`)
      return
    }
    setItems((prev) => [...prev, name])
    setDirty(true)
  }

  const requestRemove = (idx: number) => setPendingDeleteIndex(idx)

  const confirmRemove = () => {
    if (pendingDeleteIndex === null) return
    setItems((prev) => prev.filter((_, i) => i !== pendingDeleteIndex))
    setDirty(true)
    setPendingDeleteIndex(null)
  }

  const cancelRemove = () => setPendingDeleteIndex(null)

  const renameItem = (idx: number, value: string) => {
    setItems((prev) => {
      const next = prev.slice()
      next[idx] = value // soft edit; validated visually & on save
      return next
    })
    setDirty(true)
  }

  // Per-row validation (no spaces)
  const invalidReasons = useMemo(() => {
    return items.map((val) => {
      const trimmed = val.trim()
      if (!trimmed.length) return 'Cannot be empty'
      if (hasSpaces(trimmed)) return 'No spaces allowed'
      return null
    })
  }, [items])

  const canSave = useMemo(() => {
    if (!isDirty) return false
    // semantic checks: no empties / no spaces / no dupes (case-insensitive)
    const trimmed = items.map((s) => s.trim()).filter((s) => s.length > 0 && !hasSpaces(s))
    if (trimmed.length !== items.length) return false
    const lower = trimmed.map((x) => x.toLowerCase())
    return new Set(lower).size === lower.length
  }, [items, isDirty])

  const onSave = () => {
    if (!slug) return
    const normalized = items.map((s) => s.trim()).filter((s) => s.length > 0 && !hasSpaces(s))

    // TODO: uncomment this section once we have the env_types on this mutation
    mutation.mutate({
      slug,
      name: org?.name,
      // env_types: normalized,
    })
  }

  const onCancel = () => {
    setItems(originalEnvTypes)
    setDraft('')
    setDirty(false)
  }

  return (
    <ScaffoldContainer>
      <div className="space-y-6 p-2">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Environments</h1>
          <p className="text-sm text-foreground-light">
            Manage organization-wide environment types used across projects and branches.
          </p>
        </div>

        {/* Card */}
        <Card className="p-0">
          {/* Card header area */}
          <div className="flex flex-col gap-2 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-medium text-foreground">Environment types</h2>
              <p className="text-sm text-foreground-light">
                Add, rename, or remove environment type labels. Examples: <em>production</em>, <em>staging</em>, <em>preview</em>.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-6">
            {/* Presets */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="default"
                    size="tiny"
                    onClick={() => addPreset(p)}
                    className="inline-flex items-center gap-2"
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${PRESET_COLOR[p]}`} />
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {/* Existing list */}
            <div className="space-y-2">
              {items.length === 0 ? (
                <p className="text-sm text-foreground-light">No environment types defined yet.</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((val, idx) => {
                    const reason = invalidReasons[idx]
                    const isInvalid = Boolean(reason)
                    const presetColor =
                      PRESET_COLOR[val as (typeof PRESETS)[number]] ?? 'bg-foreground-muted/40'

                    return (
                      <li key={`${val}-${idx}`} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${presetColor}`} />
                          <Input_Shadcn_
                            value={val}
                            onChange={(e) => renameItem(idx, e.target.value)}
                            placeholder="e.g. production"
                            className={`h-8 text-sm ${isInvalid ? 'border-red-600 ring-1 ring-red-600' : ''}`}
                          />
                          <Button
                            type="default"
                            size="tiny"
                            className="text-red-600"
                            onClick={() => requestRemove(idx)}
                          >
                            Remove
                          </Button>
                        </div>
                        {isInvalid && (
                          <p className="text-[11px] text-red-600 pl-5">{reason}</p>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* Add new */}
            <div className="flex items-center gap-2">
              <Input_Shadcn_
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add environment (e.g. staging)"
                className={`h-8 text-sm w-full sm:w-[320px] ${
                  draft && hasSpaces(draft) ? 'border-red-600 ring-1 ring-red-600' : ''
                }`}
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem()
                  }
                }}
              />
              <Button type="default" size="tiny" onClick={addItem}>
                Add
              </Button>
            </div>
            {draft && hasSpaces(draft) && (
              <p className="text-[11px] text-red-600">
                No spaces allowed in environment names.
              </p>
            )}

            {/* Footer actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button type="default" onClick={onCancel} disabled={!isDirty || mutation.isLoading}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={onSave}
                loading={mutation.isLoading}
                disabled={!canSave || mutation.isLoading}
              >
                Save changes
              </Button>
            </div>

            {!canSave && isDirty && (
              <p className="text-[11px] text-foreground-muted">
                Remove duplicates and spaces; empty values are not allowed.
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Delete confirmation */}
      <Dialog
        open={pendingDeleteIndex !== null}
        onOpenChange={(next) => !next && setPendingDeleteIndex(null)}
      >
        <DialogContent size="small">
          <DialogHeader>
            <DialogTitle>Remove environment</DialogTitle>
            <DialogDescription>
              This will remove the selected environment type from your organization.
            </DialogDescription>
          </DialogHeader>

        <div className="text-sm text-foreground-light p-1">
          {pendingDeleteIndex !== null ? (
            <>Remove <strong>{items[pendingDeleteIndex] || 'this environment'}</strong>?</>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="default" onClick={() => setPendingDeleteIndex(null)}>Cancel</Button>
          <Button type="danger" onClick={confirmRemove}>Remove</Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScaffoldContainer>
  )
}

export default Environments
