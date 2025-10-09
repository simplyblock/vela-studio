import { toast } from 'sonner'
import { Modal } from 'ui'

import { useFDWDeleteMutation } from 'data/fdw/fdw-delete-mutation'
import type { FDW } from 'data/fdw/fdws-query'
import { getWrapperMetaForWrapper } from './Wrappers.utils'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface DeleteWrapperModalProps {
  selectedWrapper?: FDW
  onClose: () => void
}

const DeleteWrapperModal = ({ selectedWrapper, onClose }: DeleteWrapperModalProps) => {
  const { data: branch } = useSelectedBranchQuery()
  const { mutate: deleteFDW, isLoading: isDeleting } = useFDWDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully disabled ${selectedWrapper?.name} foreign data wrapper`)
      onClose()
    },
  })
  const wrapperMeta = getWrapperMetaForWrapper(selectedWrapper)

  const onConfirmDelete = async () => {
    if (!branch) return console.error('Branch is required')
    if (!selectedWrapper) return console.error('Wrapper is required')
    if (!wrapperMeta) return console.error('Wrapper meta is required')

    deleteFDW({
      branch,
      wrapper: selectedWrapper,
      wrapperMeta: wrapperMeta,
    })
  }

  return (
    <Modal
      size="medium"
      alignFooter="right"
      loading={isDeleting}
      visible={selectedWrapper !== undefined}
      onCancel={() => onClose()}
      onConfirm={() => onConfirmDelete()}
      header={`Confirm to disable ${selectedWrapper?.name}`}
    >
      <Modal.Content>
        <p className="text-sm">
          Are you sure you want to disable {selectedWrapper?.name}? This will also remove all tables
          created with this wrapper.
        </p>
      </Modal.Content>
    </Modal>
  )
}

export default DeleteWrapperModal
