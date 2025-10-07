import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, CriticalIcon } from 'ui'
import DeleteProjectButton from './DeleteProjectButton'

export const DeleteProjectPanel = () => {
  const { data: project } = useSelectedProjectQuery()

  if (project === undefined) return null

  const title = 'Deleting this project will also remove your database.'
  const description = 'Make sure you have made a backup if you want to keep your data.'

  return (
    <section id="delete-project">
      <FormHeader title="Delete Project" description="" />

      <Alert_Shadcn_ variant="destructive">
        <CriticalIcon />
        <AlertTitle_Shadcn_ className="mt-2">{title}</AlertTitle_Shadcn_>
        <AlertDescription_Shadcn_>{description}</AlertDescription_Shadcn_>
        <div className="mt-2">
          <DeleteProjectButton />
        </div>
      </Alert_Shadcn_>
    </section>
  )
}
