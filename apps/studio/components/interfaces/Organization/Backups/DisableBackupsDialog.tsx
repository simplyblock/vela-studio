import type { BackupRow } from './types'
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'ui'

type DisableBackupsDialogProps = {
  target: BackupRow | null
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export const DisableBackupsDialog = ({ target, open, onCancel, onConfirm }: DisableBackupsDialogProps) => (
  <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Disable automated backups</DialogTitle>
        <DialogDescription>
          {target
            ? `Backups for ${target.projectName} (${target.branchName}) will stop running automatically.`
            : ''}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 p-4 text-sm text-foreground-light">
        <p>You can re-enable automation at any time from this page.</p>
        <p className="text-warning-600">
          Existing backups remain available, but no new backups will be scheduled.
        </p>
      </div>
      <DialogFooter className="gap-2">
        <Button type="default" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="danger" onClick={onConfirm}>
          Disable
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)
