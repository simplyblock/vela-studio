import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import BackupScheduleModal from 'components/interfaces/Organization/Backups/BackupScheduleModal'
import { ScaffoldContainer } from 'components/layouts/Scaffold'
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

import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { toast } from 'sonner'

import { dayjsUnitMap } from './constants'
import type { BackupEnvironment, BackupRow, BranchBackup } from './types'
import { BackupsHistoryDialog } from './BackupsHistoryDialog'
import { BackupsTable } from './BackupsTable'
import { DisableBackupsDialog } from './DisableBackupsDialog'
import { RestoreBackupDialog } from './RestoreBackupDialog'
import { useOrgBackupSchedulesQuery } from 'data/backups/org-backup-schedules-query'
import { useParams } from 'common'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useOrgBackupQuery } from 'data/backups/org-backups-query'
import { mapSchedulesByBranch, groupBackupsByBranch } from './utils'
import { useDeleteBranchBackupMutation } from 'data/backups/branch-delete-backup-mutation'
import { useProjectsQuery } from 'data/projects/projects-query'
import { getBranches } from 'data/branches/branches-query'

type RestoreContext = {
  rowId: string
  backup: BranchBackup
}

type environment = {
    label: string;
    value: string;
}

const Backups = () => {
  const [disableTarget, setDisableTarget] = useState<BackupRow | null>(null)
  const [historyTarget, setHistoryTarget] = useState<BackupRow | null>(null)
  const [restoreContext, setRestoreContext] = useState<RestoreContext | null>(null)
  const [deleteContext, setDeleteContext] = useState<RestoreContext | null>(null)

 
  const {data:org} = useSelectedOrganizationQuery()
  let environments:environment[] = [{ label: 'All environments', value: 'all' },]
  if (org) {
    const envTypes: string[] = org.env_types;

    environments = [
      { label: 'All environments', value: 'all' },
      ...envTypes.map(type => ({
        label: type,
        value: type
      }))
    ];
  }
  
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all')
  const [branchFilter, setBranchFilter] = useState<string>('')
 

  const { slug: orgId } = useParams()


  const {
    data: schedules,
    isLoading: isLoadingSchedules,
    isFetching: isFetchingSchedules,
    isError: isSchedulesError,
    error: schedulesError,
  } = useOrgBackupSchedulesQuery({ orgId }, { enabled: !!orgId })

  const {
    data: backups,
    isLoading: isLoadingBackups,
    isFetching: isFetchingBackups,
    isError: isBackupsError,
    error: backupsError,
  } = useOrgBackupQuery({ orgId }, { enabled: !!orgId })

  const { data: allProjects } = useProjectsQuery()

  const { mutateAsync: deleteBranchBackup, isLoading: isDeletingBackup } = useDeleteBranchBackupMutation({
    onSuccess: () => {
      toast.success('Backup deleted')
    },
  })

  const [rows, setRows] = useState<BackupRow[]>([])
  const [branchInfoMap, setBranchInfoMap] = useState<Map<string, { name: string; projectRef: string }>>(new Map())

  const normalizedSchedules = useMemo(
    () => (Array.isArray(schedules) ? schedules : schedules ? [schedules] : []),
    [schedules]
  )

  const normalizedBackups = useMemo(
    () => (Array.isArray(backups) ? backups : backups ? [backups] : []),
    [backups]
  )

  const schedulesByBranch = useMemo(
    () => mapSchedulesByBranch(normalizedSchedules),
    [normalizedSchedules]
  )
  const backupsByBranch = useMemo(() => groupBackupsByBranch(normalizedBackups), [normalizedBackups])

  const orgProjects = useMemo(
    () => (allProjects ?? []).filter((project) => project.organization_id === org?.id),
    [allProjects, org?.id]
  )

  const projectNameMap = useMemo(() => {
    const map = new Map<string, string>()
    orgProjects.forEach((project) => {
      map.set(project.id, project.name)
    })
    return map
  }, [orgProjects])

  useEffect(() => {
    if (!orgId) return

    const projectRefSet = new Set<string>()
    if (orgProjects.length > 0) {
      orgProjects.forEach((project) => projectRefSet.add(project.id))
    } else {
      Array.from(backupsByBranch.values())
        .map((entry) => entry?.projectId)
        .filter((ref): ref is string => Boolean(ref))
        .forEach((ref) => projectRefSet.add(ref))
    }

    const projectRefs = Array.from(projectRefSet)

    if (projectRefs.length === 0) {
      setBranchInfoMap(new Map())
      return
    }

    const controller = new AbortController()
    ;(async () => {
      const map = new Map<string, { name: string; projectRef: string }>()
      try {
        const results = await Promise.all(
          projectRefs.map(async (projectRef) => {
            try {
              const branches = await getBranches({ orgRef: orgId, projectRef }, controller.signal)
              return { projectRef, branches }
            } catch (error: any) {
              if (error?.name !== 'AbortError') {
                console.error(error)
              }
              return { projectRef, branches: [] }
            }
          })
        )
        if (controller.signal.aborted) return
        results.forEach(({ projectRef, branches }) => {
          branches.forEach((branch) => {
            map.set(branch.id, { name: branch.name, projectRef })
          })
        })
        setBranchInfoMap(map)
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error(error)
        }
      }
    })()

    return () => controller.abort()
  }, [orgId, backupsByBranch, orgProjects])

  useEffect(() => {
    // Build a set of branch_ids from either side
    const branchIds = new Set<string>([
      ...Array.from(backupsByBranch.keys()),
      ...Array.from(schedulesByBranch.keys()),
    ])

    const next: BackupRow[] = []
    for (const branchId of branchIds) {
      const backupEntry = backupsByBranch.get(branchId)
      const scheduleEntry = schedulesByBranch.get(branchId)

      const schedule = scheduleEntry?.schedule ?? []
      const environment = (scheduleEntry?.env as BackupEnvironment) ?? 'development'
      
      const toTimestamp = (value: string | null) => {
        if (!value) return 0
        const parsed = Date.parse(value)
        return Number.isFinite(parsed) ? parsed : 0
      }

      const backupsList =
        backupEntry?.backups
          ?.slice()
          .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
          .map((backup) => ({
            id: backup.id,
            createdAt: backup.createdAt ?? null,
            sizeBytes: backup.sizeBytes ?? null,
            status: backup.status ?? null,
            rowIndex: backup.rowIndex,
          })) ?? []

      const branchInfo = branchInfoMap.get(branchId)
      const projectRef = backupEntry?.projectId ?? branchInfo?.projectRef ?? ''
      const projectName = projectRef ? projectNameMap.get(projectRef) ?? projectRef : 'Unknown project'
      const branchName = branchInfo?.name ?? branchId

      next.push({
        id: branchId,
        projectId: projectRef,
        projectName,
        branchId,
        branchName,
        environment: environment.toLowerCase(),
        nextBackupAt: null,
        lastBackupAt: backupsList[0]?.createdAt ?? null,
        storageUsedBytes: null,
        autoBackupEnabled: schedule.length > 0,
        resources: null,
        // @ts-ignore
        schedule,
        backups: backupsList,
      })
    }

    next.sort((a, b) => {
      const left = a.lastBackupAt ? Date.parse(a.lastBackupAt) : 0
      const right = b.lastBackupAt ? Date.parse(b.lastBackupAt) : 0
      return right - left
    })

    setRows(next)
  }, [backupsByBranch, schedulesByBranch, projectNameMap, branchInfoMap])

  const isLoadingData = isLoadingBackups || isLoadingSchedules
  const isFetchingData = isFetchingBackups || isFetchingSchedules
  const hasError = isBackupsError || isSchedulesError
  const combinedError = backupsError ?? schedulesError

  const filteredRows = useMemo(() => {
    const search = branchFilter.trim().toLowerCase()
    return rows.filter((row) => {
      const environmentValue = row.environment?.toLowerCase?.() ?? row.environment
      const matchesEnvironment =
        environmentFilter === 'all' || environmentValue === environmentFilter.toLowerCase()
      const projectName = row.projectName?.toLowerCase?.() ?? ''
      const branchName = row.branchName?.toLowerCase?.() ?? ''
      const projectId = row.projectId?.toLowerCase?.() ?? ''
      const matchesBranch =
        search.length === 0 ||
        branchName.includes(search) ||
        projectName.includes(search) ||
        projectId.includes(search)
      return matchesEnvironment && matchesBranch
    })
  }, [branchFilter, environmentFilter, rows])

  const projectOptions = useMemo(() => {
    const map = new Map<string, string>()
    if (allProjects) {
      allProjects.forEach((project) => {
        if (project.id && !map.has(project.id)) {
          map.set(project.id, project.name || project.id)
        }
      })
    }
    
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [allProjects]) 


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

  const handleBackupDelete = async (rowId: string, backupId: string) => {
    const row = rows.find((candidate) => candidate.id === rowId)
    if (!row || !orgId || !row.projectId) {
      toast.error('Unable to delete backup: missing project context')
      return
    }

    try {
      await deleteBranchBackup({
        orgId,
        projectId: row.projectId,
        branchId: row.branchId,
        backupId,
      })

      setRows((prev) => {
        let updatedRow: BackupRow | null = null
        const next = prev.map((current) => {
          if (current.id !== rowId) return current
          updatedRow = {
            ...current,
            backups: current.backups.filter((backup) => backup.id !== backupId),
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
    } catch (error) {
      // Error toast handled in mutation hook
    }
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
    <ScaffoldContainer>
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
                    {environments.map((option) => (
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

          {hasError ? (
            <div className="px-6 py-6">
              <AlertError subject="Failed to load backups" error={combinedError} />
            </div>
          ) : isLoadingData ? (
            <div className="px-6 py-6">
              <GenericSkeletonLoader />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="px-6 py-6 text-sm text-foreground-light">
              No backups found for the selected filters.
            </div>
          ) : (
            <BackupsTable
              rows={filteredRows}
              onDisable={(row) => setDisableTarget(row)}
              onEnable={handleEnable}
              onViewBackups={(row) => setHistoryTarget(row)}
            />
          )}
        </Card>
        {!isLoadingData && isFetchingData && !hasError && (
          <div className="flex items-center gap-2 text-sm text-foreground-light px-1">
            Refreshing data…
          </div>
        )}
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
              disabled={isDeletingBackup}
              onClick={async () => {
                if (deleteContext) {
                  await handleBackupDelete(deleteContext.rowId, deleteContext.backup.id)
                }
              }}
            >
              {isDeletingBackup ? 'Deleting…' : 'Delete backup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScaffoldContainer>
  )
}

export default Backups
