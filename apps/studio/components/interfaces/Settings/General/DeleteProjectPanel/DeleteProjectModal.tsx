import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { LOCAL_STORAGE_KEYS } from 'common'
import { useProjectDeleteMutation } from 'data/projects/project-delete-mutation'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export const DeleteProjectModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  const [lastVisitedOrganization] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_ORGANIZATION,
    ''
  )

  const { mutate: deleteProject, isLoading: isDeleting } = useProjectDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted ${project?.name}`)

      if (lastVisitedOrganization) router.push(`/org/${lastVisitedOrganization}`)
      else router.push('/organizations')
    },
  })
  const isSubmitting = isDeleting

  async function handleDeleteProject() {
    if (project === undefined) return
    deleteProject({ projectRef: project.id, organizationSlug: organization?.slug })
  }

  return (
    <TextConfirmModal
      visible={visible}
      loading={isSubmitting}
      size={'xlarge'}
      title={`Confirm deletion of ${project?.name}`}
      variant="destructive"
      alert={{
        title: 'This action cannot be undone.',
        description: 'All project data will be lost, and cannot be undone',
      }}
      text={
        `This will permanently delete the ${project?.name} project and all of its data.`
      }
      confirmPlaceholder="Type the project name in here"
      confirmString={project?.name || ''}
      confirmLabel="I understand, delete this project"
      onConfirm={handleDeleteProject}
      onCancel={() => {
        if (!isSubmitting) onClose()
      }}
    >
    </TextConfirmModal>
  )
}
