import { toast } from 'sonner'

import { useEnumeratedTypeDeleteMutation } from 'data/enumerated-types/enumerated-type-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useBranchQuery } from '../../../../data/branches/branch-query'
import { useParams } from 'common'

interface DeleteEnumeratedTypeModalProps {
  visible: boolean
  selectedEnumeratedType?: any
  onClose: () => void
}

const DeleteEnumeratedTypeModal = ({
  visible,
  selectedEnumeratedType,
  onClose,
}: DeleteEnumeratedTypeModalProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useBranchQuery({ orgRef, projectRef, branchRef })
  const { mutate: deleteEnumeratedType, isLoading: isDeleting } = useEnumeratedTypeDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted "${selectedEnumeratedType.name}"`)
      onClose()
    },
  })

  const onConfirmDeleteType = () => {
    if (selectedEnumeratedType === undefined) return console.error('No enumerated type selected')
    if (project?.ref === undefined) return console.error('Project ref required')
    if (branch === undefined) return console.error('Branch connectionString required')

    deleteEnumeratedType({
      branch,
      name: selectedEnumeratedType.name,
      schema: selectedEnumeratedType.schema,
    })
  }

  return (
    <ConfirmationModal
      variant={'destructive'}
      size="medium"
      loading={isDeleting}
      visible={visible}
      title={
        <>
          Confirm to delete enumerated type{' '}
          <code className="text-sm">{selectedEnumeratedType?.name}</code>
        </>
      }
      confirmLabel="Confirm delete"
      confirmLabelLoading="Deleting..."
      onCancel={onClose}
      onConfirm={() => onConfirmDeleteType()}
      alert={{
        title: 'This action cannot be undone',
        description:
          'You will need to re-create the enumerated type if you want to revert the deletion.',
      }}
    >
      <p className="text-sm">Before deleting this enumerated type, consider:</p>
      <ul className="space-y-2 mt-2 text-sm text-foreground-light">
        <li className="list-disc ml-6">
          This enumerated type is no longer in use in any tables or functions
        </li>
      </ul>
    </ConfirmationModal>
  )
}

export default DeleteEnumeratedTypeModal
