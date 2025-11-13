import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useParams } from 'common'
import { useBranchQuery } from 'data/branches/branch-query'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  CriticalIcon,
} from 'ui'
import DeleteBranchButton from './DeleteBranchButton'

export const DeleteBranchPanel = () => {
  const { slug, ref, branch } = useParams() as {
    slug?: string
    ref?: string
    branch?: string
  }

  const { data: branchData } = useBranchQuery(
    { orgRef: slug, projectRef: ref, branchRef: branch },
    { enabled: !!slug && !!ref && !!branch }
  )

  if (!branchData) return null

  const title = 'Deleting this branch will also remove its database.'
  const description = 'Make sure you have created a backup if you want to keep the data.'

  return (
    <section id="delete-branch">
      <FormHeader
        title="Delete branch"
        description={`Delete branch ${branchData.name}. This operation cannot be undone.`}
      />

      <Alert_Shadcn_ variant="destructive">
        <CriticalIcon />
        <AlertTitle_Shadcn_ className="mt-2">{title}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
        <div className="mt-2">
          <DeleteBranchButton />
        </div>
      </Alert_Shadcn_>
    </section>
  )
}

export default DeleteBranchPanel
