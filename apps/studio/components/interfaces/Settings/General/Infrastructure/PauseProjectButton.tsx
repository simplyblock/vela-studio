import { useQueryClient } from '@tanstack/react-query'
import { Pause } from 'lucide-react'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { toast } from 'sonner'

import { useIsProjectActive } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useProjectPauseMutation } from 'data/projects/project-pause-mutation'
import { setProjectStatus } from 'data/projects/projects-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useParams } from 'common'

const PauseProjectButton = () => {
  const router = useRouter()
  const { slug } = useParams()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const isProjectActive = useIsProjectActive()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const projectRef = project?.ref ?? ''
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
    // FIXME: need permission implemented 
  const { can: canPauseProject } = {can:true}

  const { mutate: pauseProject, isLoading: isPausing } = useProjectPauseMutation({
    onSuccess: (_, variables) => {
      setProjectStatus(queryClient, slug as string, variables.ref, PROJECT_STATUS.PAUSING)
      toast.success('Pausing project...')
      router.push(`/org/${slug}/project/${projectRef}`)
    },
  })

  const requestPauseProject = () => {
    if (!canPauseProject) {
      return toast.error('You do not have the required permissions to pause this project')
    }
    pauseProject({ ref: projectRef })
  }

  const buttonDisabled = project === undefined || isPaused || !canPauseProject || !isProjectActive

  return (
    <>
      <ButtonTooltip
        type="default"
        icon={<Pause />}
        onClick={() => setIsModalOpen(true)}
        loading={isPausing}
        disabled={buttonDisabled}
        tooltip={{
          content: {
            side: 'bottom',
            text: isPaused
              ? 'Your project is already paused'
              : !canPauseProject
                ? 'You need additional permissions to pause this project'
                : !isProjectActive
                  ? 'Unable to pause project as project is not active'
                  : undefined,
          },
        }}
      >
        Pause project
      </ButtonTooltip>

      <ConfirmationModal
        variant={'destructive'}
        visible={isModalOpen}
        loading={isPausing}
        title="Pause this project?"
        confirmLabel="Pause project"
        confirmLabelLoading="Pausing project"
        onCancel={() => setIsModalOpen(false)}
        onConfirm={requestPauseProject}
      >
        <p className="text-foreground-light text-sm">
          Are you sure you want to pause this project? It will not be accessible until you unpause
          it.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default PauseProjectButton
