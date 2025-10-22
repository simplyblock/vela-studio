import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import DatabaseBackupsNav from '../DatabaseBackupsNav'
import { BackupsEmpty } from '../BackupsEmpty'
import { BackupsStorageAlert } from '../BackupsStorageAlert'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useBranchBackupQuery } from 'data/backups/branch-backups-query'
import { useManualBranchBackupMutation } from 'data/backups/branch-manual-backup-mutation'
import { useParams } from 'common'
import { formatBytes } from 'lib/helpers'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

type NormalizedBackup = {
  id: string
  createdAt: string | null
  sizeBytes?: number | null
  status?: string | null
  rowIndex?: number | null
}

const toArray = <T,>(value: T | T[] | undefined | null) =>
  Array.isArray(value) ? value : value ? [value] : []

const normalizeBackups = (data: any): NormalizedBackup[] => {
  const backups = toArray<any>(data)
  return backups
    .map((item) => {
      const createdAt =
        (item?.created_at as string | undefined) ??
        (item?.createdAt as string | undefined) ??
        null

      return {
        id: String(item?.id ?? ''),
        createdAt,
        sizeBytes:
          (item?.size_bytes as number | undefined) ??
          (item?.sizeBytes as number | undefined) ??
          null,
        status:
          (item?.status as string | undefined) ??
          (item?.state as string | undefined) ??
          null,
        rowIndex:
          (item?.row_index as number | undefined) ??
          (item?.rowIndex as number | undefined) ??
          null,
      }
    })
    .filter((item) => item.id.length > 0)
    .sort((a, b) => {
      const left = a.createdAt ? Date.parse(a.createdAt) : 0
      const right = b.createdAt ? Date.parse(b.createdAt) : 0
      return right - left
    })
}

const BranchBackups = () => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()

  const {
    data,
    error,
    isError,
    isLoading,
    isFetching,
  } = useBranchBackupQuery(
    { orgId, projectId, branchId },
    { enabled: Boolean(orgId && projectId && branchId) }
  )

  const backups = useMemo(() => normalizeBackups(data), [data])

  const {
    mutate: triggerManual,
    isLoading: isCreating,
  } = useManualBranchBackupMutation({
    onSuccess: () => {
      toast.success('Manual backup started')
    },
  })

  const handleCreateBackup = () => {
    if (!orgId || !projectId || !branchId) return
    triggerManual({ orgId, projectId, branchId })
  }

  return (
    <ScaffoldContainer>
      <ScaffoldSection>
        <div className="col-span-12">
          <div className="space-y-6">
            <FormHeader className="!mb-0" title="Database Backups" />
            <DatabaseBackupsNav active="pitr" />

            {isError ? (
              <AlertError subject="Failed to load backups" error={error} />
            ) : (
              <>
                <BackupsStorageAlert />
                <Card>
                  <CardHeader className="flex flex-row justify-between gap-3">
                    <div>
                      <CardTitle>Backup history</CardTitle>
                      <p className="text-sm text-foreground-light">
                        Review available snapshots and create manual backups for this branch.
                      </p>
                    </div>
                    <Button
                      type="outline"
                      onClick={handleCreateBackup}
                      disabled={isCreating || !orgId || !projectId || !branchId}
                      className="flex items-center gap-2"
                    >
                      {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                      Start manual backup
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <GenericSkeletonLoader />
                    ) : backups.length === 0 ? (
                      <BackupsEmpty />
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[180px]">Created</TableHead>
                              <TableHead className="min-w-[140px]">Backup ID</TableHead>
                              <TableHead className="min-w-[120px]">Status</TableHead>
                              <TableHead className="min-w-[120px] text-right">Size</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backups.map((backup) => {
                              const normalizedStatus = backup.status
                                ? backup.status.toLowerCase()
                                : undefined

                              return (
                                <TableRow key={backup.id}>
                                  <TableCell className="text-sm text-foreground-light">
                                    {backup.createdAt ? (
                                      <TimestampInfo utcTimestamp={backup.createdAt} />
                                    ) : (
                                      'Unknown'
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-mono text-xs text-foreground" title={backup.id}>
                                      {backup.id}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {normalizedStatus ? (
                                      <Badge variant={normalizedStatus === 'completed' ? 'default' : 'outline'}>
                                        {normalizedStatus}
                                      </Badge>
                                    ) : (
                                      <span className="text-sm text-foreground-light">—</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right text-sm text-foreground-light">
                                    {typeof backup.sizeBytes === 'number'
                                      ? formatBytes(backup.sizeBytes, 2)
                                      : '—'}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {!isLoading && isFetching && (
                  <div className="flex items-center gap-2 text-sm text-foreground-light">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Refreshing backups…
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}

export default BranchBackups
