import { toast } from 'sonner'

import { useUserDeleteMutation } from 'data/auth/user-delete-mutation'
import { User } from 'data/auth/users-infinite-query'
import { timeout } from 'lib/helpers'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface DeleteUserModalProps {
  visible: boolean
  selectedUser?: User
  onClose: () => void
  onDeleteSuccess?: () => void
}

export const DeleteUserModal = ({
  visible,
  selectedUser,
  onClose,
  onDeleteSuccess,
}: DeleteUserModalProps) => {
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: deleteUser, isLoading: isDeleting } = useUserDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted ${selectedUser?.email}`)
      onDeleteSuccess?.()
    },
  })

  const handleDeleteUser = async () => {
    await timeout(200)
    if (!branch) return console.error('Branch is required')
    if (selectedUser?.id === undefined) {
      return toast.error(`Failed to delete user: User ID not found`)
    }
    deleteUser({
      orgId: branch.organization_id,
      projectId: branch.project_id,
      branchId: branch.id,
      userId: selectedUser.id
    })
  }

  return (
    <ConfirmationModal
      visible={visible}
      variant="destructive"
      title="Confirm to delete user"
      loading={isDeleting}
      confirmLabel="Delete"
      onCancel={() => onClose()}
      onConfirm={() => handleDeleteUser()}
      alert={{
        title: 'Deleting a user is irreversible',
        description:
          'This will remove the selected the user from the project and all associated data.',
      }}
    >
      <p className="text-sm text-foreground-light">
        This is permanent! Are you sure you want to delete the user{' '}
        {selectedUser?.email ?? 'this user'}?
      </p>
    </ConfirmationModal>
  )
}
