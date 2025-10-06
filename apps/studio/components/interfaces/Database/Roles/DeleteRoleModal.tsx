import type { PostgresRole } from '@supabase/postgres-meta'
import { toast } from 'sonner'

import { useDatabaseRoleDeleteMutation } from 'data/database-roles/database-role-delete-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Modal } from 'ui'
import { useSelectedBranchQuery } from '../../../../data/branches/selected-branch-query'

interface DeleteRoleModalProps {
  role: PostgresRole
  visible: boolean
  onClose: () => void
}

export const DeleteRoleModal = ({ role, visible, onClose }: DeleteRoleModalProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const { mutate: deleteDatabaseRole, isLoading: isDeleting } = useDatabaseRoleDeleteMutation({
    onSuccess: () => {
      toast.success(`Successfully deleted role: ${role.name}`)
      onClose()
    },
  })

  const deleteRole = async () => {
    if (!project) return console.error('Project is required')
    if (!branch) return console.error('Branch is required')
    if (!role) return console.error('Failed to delete role: role is missing')
    deleteDatabaseRole({
      projectRef: project.ref,
      connectionString: branch.database.encrypted_connection_string,
      id: role.id,
    })
  }

  return (
    <Modal
      size="small"
      alignFooter="right"
      visible={visible}
      onCancel={onClose}
      onConfirm={deleteRole}
      header={<h3>Confirm to delete role "{role?.name}"</h3>}
      loading={isDeleting}
    >
      <Modal.Content>
        <p className="text-sm">
          This will automatically revoke any membership of this role in other roles, and this action
          cannot be undone.
        </p>
      </Modal.Content>
    </Modal>
  )
}
