import { useState } from 'react'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DeleteProjectModal } from './DeleteProjectModal'

export interface DeleteProjectButtonProps {
  type?: 'danger' | 'default'
}

const DeleteProjectButton = ({ type = 'danger' }: DeleteProjectButtonProps) => {
  const { data: project } = useSelectedProjectQuery()
  const [isOpen, setIsOpen] = useState(false)
  // FIXME: need permission implemented 
  const { can: canDeleteProject } = {can:true}

  return (
    <>
      <ButtonTooltip
        type={type}
        disabled={!canDeleteProject}
        onClick={() => setIsOpen(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canDeleteProject
              ? 'You need additional permissions to delete this project'
              : undefined,
          },
        }}
      >
        Delete project
      </ButtonTooltip>
      <DeleteProjectModal visible={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default DeleteProjectButton
