import { useRouter } from 'next/router'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useBranchQuery } from 'data/branches/branch-query'
import { useBranchDeleteMutation } from 'data/branches/branch-delete-mutation'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'

export const DeleteBranchModal = ({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const { slug, ref, branch } = useParams() as {
    slug?: string
    ref?: string
    branch?: string
  }

  const { data: project } = useSelectedProjectQuery()
  const { data: branchData } = useBranchQuery(
    { orgRef: slug, projectRef: ref, branchRef: branch },
    { enabled: !!slug && !!ref && !!branch }
  )

  const { mutate: deleteBranch, isPending: isDeleting } = useBranchDeleteMutation({
    onSuccess: async () => {
      toast.success(`Successfully deleted branch ${branchData?.name ?? ''}`)

      // Redirect back to project overview
      if (project?.organization_id && project?.id) {
        router.push(`/org/${project.organization_id}/project/${project.id}`)
      } else if (slug && ref) {
        router.push(`/org/${slug}/project/${ref}`)
      } else {
        router.push('/projects')
      }
    },
  })

  const isSubmitting = isDeleting

  async function handleDeleteBranch() {
    if (!slug || !ref || !branch) return

    deleteBranch({
      orgRef: slug,
      projectRef: ref,
      branchRef: branch,
    } as any)
  }

  const branchName = branchData?.name ?? branch ?? ''

  return (
    <TextConfirmModal
      visible={visible}
      loading={isSubmitting}
      size="xlarge"
      title={`Confirm deletion of ${branchName || 'this branch'}`}
      variant="destructive"
      alert={{
        title: 'This action cannot be undone.',
        description: 'All branch data will be lost, and cannot be undone.',
      }}
      text={`This will permanently delete the ${branchName || 'selected'} branch and all of its data.`}
      confirmPlaceholder="Type the branch name in here"
      confirmString={branchName}
      confirmLabel="I understand, delete this branch"
      onConfirm={handleDeleteBranch}
      onCancel={() => {
        if (!isSubmitting) onClose()
      }}
    />
  )
}
