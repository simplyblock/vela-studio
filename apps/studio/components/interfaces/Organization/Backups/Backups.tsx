import dayjs from 'dayjs'
import { useMemo, useState } from 'react'

import BackupScheduleModal from 'components/interfaces/Branch/BackupScheduleModal'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import {
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Select_Shadcn_,
  Button,
} from 'ui'

import { dayjsUnitMap } from './constants'
import { initialBackupRows } from './mockData'
import type { BackupEnvironment, BackupRow, BranchBackup } from './types'
import { BackupsHistoryDialog } from './BackupsHistoryDialog'
import { BackupsTable } from './BackupsTable'
import { DisableBackupsDialog } from './DisableBackupsDialog'
import { RestoreBackupDialog } from './RestoreBackupDialog'

type RestoreContext = {
  rowId: string
  backup: BranchBackup
}

const environmentOptions: Array<{ label: string; value: BackupEnvironment | 'all' }> = [
  { label: 'All environments', value: 'all' },
  { label: 'Production', value: 'production' },
  { label: 'Test', value: 'test' },
  { label: 'Development', value: 'development' },
]

const Backups = () => {
  const [rows, setRows] = useState<BackupRow[]>(initialBackupRows)
  const [disableTarget, setDisableTarget] = useState<BackupRow | null>(null)
  const [historyTarget, setHistoryTarget] = useState<BackupRow | null>(null)
  const [restoreContext, setRestoreContext] = useState<RestoreContext | null>(null)
  const [deleteContext, setDeleteContext] = useState<RestoreContext | null>(null)
  const [environmentFilter, setEnvironmentFilter] = useState<BackupEnvironment | 'all'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('')

  const filteredRows = useMemo(() => {
    const search = branchFilter.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesEnvironment = environmentFilter === 'all' || row.environment === environmentFilter
      const matchesBranch =
        search.length === 0 ||
        row.branchName.toLowerCase().includes(search) ||
        row.projectName.toLowerCase().includes(search)
      return matchesEnvironment && matchesBranch
    })
  }, [branchFilter, environmentFilter, rows])

  const projectOptions = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.projectName))).map((project) => ({
        label: project,
        value: project,
      })),
    [rows]
  )

  const restoreRow = useMemo(
    () => rows.find((row) => row.id === restoreContext?.rowId) ?? null,
    [restoreContext, rows]
  )

  const deleteRow = useMemo(
    () => rows.find((row) => row.id === deleteContext?.rowId) ?? null,
    [deleteContext, rows]
  )
  const handleEnable = (target: BackupRow) => {
    const nextUnit = target.schedule[0]?.unit ?? 'hours'
    const nextEvery = target.schedule[0]?.every ?? 1
    const nextRun = dayjs().add(nextEvery, dayjsUnitMap[nextUnit])

    setRows((prev) =>
      prev.map((row) =>
        row.id === target.id
          ? {
              ...row,
              autoBackupEnabled: true,
              nextBackupAt: nextRun.toISOString(),
            }
          : row
      )
    )
  }

  const handleDisableConfirm = () => {
    if (!disableTarget) return

    setRows((prev) =>
      prev.map((row) =>
        row.id === disableTarget.id
          ? {
              ...row,
              autoBackupEnabled: false,
              nextBackupAt: null,
            }
          : row
      )
    )
    setDisableTarget(null)
  }

  const handleBackupDelete = (rowId: string, backupId: string) => {
    setRows((prev) => {
      let updatedRow: BackupRow | null = null
      const next = prev.map((row) => {
        if (row.id !== rowId) return row
        updatedRow = {
          ...row,
          backups: row.backups.filter((backup) => backup.id !== backupId),
        }
        return updatedRow
      })
      if (updatedRow) {
        setHistoryTarget((current) => (current?.id === rowId ? updatedRow : current))
        if (deleteContext?.rowId === rowId && deleteContext.backup.id === backupId) {
          setDeleteContext(null)
        }
      }
      return next
    })
  }

  const handleRestoreConfirm = (payload: { mode: 'same-branch' | 'new-branch'; project?: string; branchName?: string }) => {
    if (!restoreContext) return

    setRows((prev) => {
      let updatedRow: BackupRow | null = null
      const next = prev.map((row) => {
        if (row.id !== restoreContext.rowId) return row
        if (payload.mode === 'same-branch') {
          updatedRow = {
            ...row,
            lastBackupAt: restoreContext.backup.createdAt,
          }
          return updatedRow
        }
        updatedRow = row
        return row
      })
      if (updatedRow) {
        setHistoryTarget((current) => (current?.id === updatedRow?.id ? updatedRow : current))
      }
      return next
    })

    if (payload.mode === 'new-branch') {
      console.log('Restore backup to new branch', {
        backupId: restoreContext.backup.id,
        project: payload.project,
        branchName: payload.branchName,
      })
    }

    setRestoreContext(null)
  }

  return (
    <ScaffoldContainerLegacy>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Backups</h1>
          <p className="text-sm text-foreground-light">
            Monitor automated backups across projects, update schedules, and restore branches as needed.
          </p>
        </div>

        <Card className="p-0">
          <div className="flex flex-col gap-4 border-b border-border px-6 py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-medium text-foreground">Automated backup schedules</h2>
                <p className="text-sm text-foreground-light">
                  Review schedules per project, adjust cadence, or initiate restores from historical backups.
                </p>
              </div>
              <BackupScheduleModal />
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Select_Shadcn_ value={environmentFilter} onValueChange={(value) => setEnvironmentFilter(value as BackupEnvironment | 'all')}>
                  <SelectTrigger_Shadcn_ className="w-full sm:w-[220px]">
                    <SelectValue_Shadcn_ />
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    {environmentOptions.map((option) => (
                      <SelectItem_Shadcn_ key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem_Shadcn_>
                    ))}
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>

                <Input_Shadcn_
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                  placeholder="Filter by project or branch"
                  className="w-full sm:w-[260px]"
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <BackupsTable
            rows={filteredRows}
            onDisable={(row) => setDisableTarget(row)}
            onEnable={handleEnable}
            onViewBackups={(row) => setHistoryTarget(row)}
          />
        </Card>
      </div>

      <DisableBackupsDialog
        target={disableTarget}
        open={disableTarget !== null}
        onCancel={() => setDisableTarget(null)}
        onConfirm={handleDisableConfirm}
      />

      <BackupsHistoryDialog
        target={historyTarget}
        open={historyTarget !== null}
        onClose={() => setHistoryTarget(null)}
        onRestore={(backup) => historyTarget && setRestoreContext({ rowId: historyTarget.id, backup })}
        onDeleteRequest={(backup) => historyTarget && setDeleteContext({ rowId: historyTarget.id, backup })}
      />

      <RestoreBackupDialog
        row={restoreRow}
        backup={restoreContext?.backup ?? null}
        open={restoreContext !== null}
        projectOptions={projectOptions}
        onCancel={() => setRestoreContext(null)}
        onConfirm={handleRestoreConfirm}
      />

      <Dialog open={deleteContext !== null} onOpenChange={(nextOpen) => !nextOpen && setDeleteContext(null)}>
        <DialogContent size={"xlarge"}>
          <DialogHeader>
            <DialogTitle>Delete backup</DialogTitle>
            <DialogDescription>
              {deleteContext
                ? `Remove backup ${deleteContext.backup.id} from ${deleteRow?.projectName ?? 'project'}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-2 text-sm text-foreground-light">
            <p>This action permanently removes the selected snapshot and cannot be undone.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="default" onClick={() => setDeleteContext(null)}>
              Cancel
            </Button>
            <Button
              type="danger"
              onClick={() => {
                if (deleteContext) {
                  handleBackupDelete(deleteContext.rowId, deleteContext.backup.id)
                }
              }}
            >
              Delete backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScaffoldContainerLegacy>
  )
}

export default Backups
