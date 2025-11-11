'use client'

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { NextPageWithLayout } from 'types'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
import { Button, Card, Input_Shadcn_, cn } from 'ui'
import { getPathReferences } from 'data/vela/path-references'
import { useProjectUpdateMutation } from 'data/projects/project-update-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'

/**
 * Page: Edit project's max_backups
 *
 * Note: uses useProjectUpdateMutation but DOES NOT pass max_backups for now.
 * The shared mutation has a TODO to accept max_backups later.
 */
const ProjectBackupsPage: NextPageWithLayout = () => {
  const { slug, ref } = getPathReferences()

  const { data: project } = useSelectedProjectQuery()

  const currentVal = project?.max_backups ?? null // null/undefined => unlimited

  const [input, setInput] = useState<string>(currentVal == null ? '' : String(currentVal))
  const [isDirty, setDirty] = useState(false)

  const parsed = useMemo(() => {
    const trimmed = input.trim()
    if (trimmed === '') return { ok: true, value: null } // empty means unlimited
    const asNum = Number(trimmed)
    if (!Number.isFinite(asNum) || !Number.isInteger(asNum) || asNum < 0) {
      return { ok: false, error: 'Must be a non-negative integer' }
    }
    return { ok: true, value: asNum }
  }, [input])

  const mutation = useProjectUpdateMutation({
    onSuccess: () => {
      toast.success('Max backups updated')
    },
  })

  const onSave = () => {
    if (!slug || !ref) return
    if (!parsed.ok) {
      toast.error((parsed as any).error || 'Invalid value')
      return
    }


    mutation.mutate({
      orgRef: slug,
      ref,
      name: project?.name ?? '', 
      max_backups: parseInt(input),
    })
  }

  const onCancel = () => {
    setInput(currentVal == null ? '' : String(currentVal))
    setDirty(false)
  }

  const loading = mutation.isLoading

  return (
    <ScaffoldContainer>
      <div className="space-y-6 p-2">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Project backups</h1>
          <p className="text-sm text-foreground-light">Configure the maximum number of backups kept for this project.</p>
        </div>

        <Card className="p-0">
          <div className="flex flex-col gap-2 border-b border-border px-6 py-4">
            <div>
              <h2 className="text-base font-medium text-foreground">Max backups</h2>
              <p className="text-sm text-foreground-light">
                Enter a non-negative integer
              </p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            <div className="space-y-1">
              <label className="text-xs text-foreground-muted">Max backups</label>
              <Input_Shadcn_
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setDirty(true)
                }}
                placeholder="Leave empty for unlimited"
                className={cn('h-10 text-sm w-full sm:w-[320px]', !parsed.ok ? 'border-red-600 ring-1 ring-red-600' : '')}
                type="number"
                inputMode="numeric"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onSave()
                  }
                }}
              />
              {!parsed.ok ? <p className="text-[11px] text-red-600">{(parsed as any).error}</p> : null}

              <p className="text-[12px] text-foreground-muted mt-1">
                Current: {currentVal == null ? 'Unlimited' : currentVal}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button type="default" onClick={onCancel} disabled={!isDirty || loading}>
                Cancel
              </Button>
              <Button type="primary" onClick={onSave} loading={loading} disabled={!isDirty || !parsed.ok || loading}>
                Save changes
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ScaffoldContainer>
  )
}

/* Layout wrappers to keep consistency across the app */
ProjectBackupsPage.getLayout = (page) => (
  <DefaultLayout>
    <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>
  </DefaultLayout>
)

export default ProjectBackupsPage
