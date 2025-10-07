import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useDatabaseQueueDeleteMutation } from 'data/database-queues/database-queues-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { useParams } from 'common'
import { useSelectedBranchQuery } from '../../../../../data/branches/selected-branch-query'

interface DeleteQueueProps {
  queueName: string
  visible: boolean
  onClose: () => void
}

const DeleteQueue = ({ queueName, visible, onClose }: DeleteQueueProps) => {
  const { slug: orgRef, branch: branchRef } = useParams()
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: deleteDatabaseQueue, isLoading } = useDatabaseQueueDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully removed queue ${queueName}`)
      router.push(`/org/${orgRef}/project/${project?.ref}/branch/${branchRef}/integrations/queues/queues`)
      onClose()
    },
  })

  async function handleDelete() {
    if (!branch) return console.error('Branch is required')

    deleteDatabaseQueue({
      queueName: queueName,
      branch,
    })
  }

  if (!queueName) {
    return null
  }

  return (
    <TextConfirmModal
      variant="destructive"
      visible={visible}
      onCancel={() => onClose()}
      onConfirm={handleDelete}
      title="Delete this queue"
      loading={isLoading}
      confirmLabel={`Delete queue ${queueName}`}
      confirmPlaceholder="Type in name of queue"
      confirmString={queueName ?? 'Unknown'}
      text={
        <>
          <span>This will delete the queue</span>{' '}
          <span className="text-bold text-foreground">{queueName}</span>
        </>
      }
      alert={{ title: 'You cannot recover this queue and its messages once deleted.' }}
    />
  )
}

export default DeleteQueue
