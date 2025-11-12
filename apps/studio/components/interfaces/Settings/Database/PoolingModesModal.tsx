import { Markdown } from 'components/interfaces/Markdown'
import { useDatabaseSettingsStateSnapshot } from 'state/database-settings'
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

export const PoolingModesModal = () => {
  const snap = useDatabaseSettingsStateSnapshot()

  return (
    <Dialog open={snap.showPoolingModeHelper} onOpenChange={snap.setShowPoolingModeHelper}>
      <DialogContent hideClose className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            <div className="w-full flex items-center justify-between">
              <p className="max-w-2xl">Which pooling mode should I use?</p>
            </div>
          </DialogTitle>
          <DialogDescription className="max-w-2xl">
            A connection pooler is a system (external to Postgres) which manages Postgres
            connections by allocating connections whenever clients make requests.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <Markdown
            className="max-w-full [&>h3]:text-sm"
            content={`
Each pooling mode handles connections differently.

### Transaction mode
This mode is recommended if you are connecting from *serverless environments*. A connection is assigned to the client for the duration of a transaction. Two consecutive transactions from the same client could be executed over two different connections. Some session-based Postgres features such as prepared statements are *not available* with this option.

### Session mode
This mode is similar to connecting to your database directly. There is full support for prepared statements in this mode. When a new client connects, a connection is assigned to the client until it disconnects. You *might run into pooler connection limits* since the connection is held till the client disconnects.

### Using session and transaction modes at the same time
 ${
     'To get the best of both worlds, as a starting point, we recommend using session mode just when you need support for prepared statements and transaction mode in other cases.'
 }
`}
          />
        </DialogSection>
        <DialogFooter>
          <DialogClose onClick={() => snap.setShowPoolingModeHelper(false)}>
            <Button type="default">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
