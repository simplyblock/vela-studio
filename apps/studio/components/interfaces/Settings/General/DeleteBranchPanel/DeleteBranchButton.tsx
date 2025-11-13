import { useState } from 'react'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { DeleteBranchModal } from './DeleteBranchModal'

export interface DeleteBranchButtonProps {
  type?: 'danger' | 'default'
}

const DeleteBranchButton = ({ type = 'danger' }: DeleteBranchButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)

  // NOTE: permission string can be adjusted to match your RBAC config
  const { can: canDeleteBranch } = useCheckPermissions('env:branches:delete')

  return (
    <>
      <ButtonTooltip
        type={type}
        disabled={!canDeleteBranch}
        onClick={() => setIsOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canDeleteBranch
              ? 'You need additional permissions to delete this branch'
              : undefined,
          },
        }}
      >
        Delete branch
      </ButtonTooltip>

      <DeleteBranchModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default DeleteBranchButton
