import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useDatabaseQueuePurgeMutation } from 'data/database-queues/database-queues-purge-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { useParams } from 'common'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface PurgeQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

const PurgeQueue = ({ queueName, visible, onClose }: PurgeQueueProps) => {
  const { slug: orgRef, branch: branchRef } = useParams()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: purgeDatabaseQueue, isLoading } = useDatabaseQueuePurgeMutation({
    onSuccess: () => {
      toast.success(`Successfully purged queue ${queueName}`)
      router.push(`/org/${orgRef}/project/${project?.ref}/branch/${branchRef}/integrations/queues`)
      onClose()
    },
  })

  async function handlePurge() {
    if (!branch) return console.error('Branch is required')

    purgeDatabaseQueue({
      queueName: queueName,
      branch,
    })
  }

  if (!queueName) {
    return null
  }

  return (
    <TextConfirmModal
      variant="warning"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handlePurge}
      title="Purge this queue"
      loading={isLoading}
      confirmLabel={`Purge queue ${queueName}`}
      confirmPlaceholder="Type in name of queue"
      confirmString={queueName ?? 'Unknown'}
      text={
        <>
          <span>This will purge the queue</span>{' '}
          <span className="text-bold text-foreground">{queueName}</span>
        </>
      }
      alert={{
        title:
          "This action will delete all messages from the queue. They can't be recovered afterwards.",
      }}
    />
  )
}

export default PurgeQueue
