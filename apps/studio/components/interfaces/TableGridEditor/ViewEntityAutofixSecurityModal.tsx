import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useViewDefinitionQuery } from 'data/database/view-definition-query'
import { lintKeys } from 'data/lint/keys'
import { useExecuteSqlMutation } from 'data/sql/execute-sql-mutation'
import { Entity, isViewLike } from 'data/table-editor/table-editor-types'
import { ScrollArea, SimpleCodeBlock } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

interface ViewEntityAutofixSecurityModalProps {
  table: Entity
  isAutofixViewSecurityModalOpen: boolean
  setIsAutofixViewSecurityModalOpen: (isAutofixViewSecurityModalOpen: boolean) => void
}

export default function ViewEntityAutofixSecurityModal({
  table,
  isAutofixViewSecurityModalOpen,
  setIsAutofixViewSecurityModalOpen,
}: ViewEntityAutofixSecurityModalProps) {
  const { data: branch } = useSelectedBranchQuery()
  const queryClient = useQueryClient()
  const { isSuccess, isLoading, data } = useViewDefinitionQuery(
    {
      branch,
      id: table?.id,
    },
    {
      enabled: isAutofixViewSecurityModalOpen && isViewLike(table),
    }
  )

  const { mutate: execute } = useExecuteSqlMutation({
    onSuccess: async () => {
      toast.success('View security changed successfully')
      setIsAutofixViewSecurityModalOpen(false)
      await queryClient.invalidateQueries(
        lintKeys.lint(branch?.organization_id, branch?.project_id, branch?.id)
      )
    },
    onError: (error) => {
      toast.error(`Failed to autofix view security: ${error.message}`)
    },
  })

  function handleConfirm() {
    const sql = `
	ALTER VIEW "${table.schema}"."${table.name}" SET (security_invoker = on);
	`
    execute({
      branch,
      sql,
    })
  }

  if (!isViewLike(table)) {
    return null
  }

  return (
    <ConfirmationModal
      visible={isAutofixViewSecurityModalOpen}
      size="xlarge"
      title="Confirm autofixing view security"
      confirmLabel="Confirm"
      onCancel={() => setIsAutofixViewSecurityModalOpen(false)}
      onConfirm={() => handleConfirm()}
    >
      <p className="text-sm text-foreground-light">
        Setting <code>security_invoker=on</code> ensures the View runs with the permissions of the
        querying user, reducing the risk of unintended data exposure.
      </p>
      <div className="flex items-center gap-8 mt-8">
        <div className=" border rounded-md w-1/2">
          <div className="p-4 pb-0 bg-200 font-mono text-sm font-semibold">Existing query</div>
          <ScrollArea className="h-[225px] px-4 py-2">
            {isLoading && <GenericSkeletonLoader />}
            {isSuccess && (
              <SimpleCodeBlock>
                {`create view ${table.schema}.${table.name} as\n ${data}`}
              </SimpleCodeBlock>
            )}
          </ScrollArea>
        </div>

        <div className=" border rounded-md w-1/2">
          <div className="p-4 pb-0 bg-200 font-mono text-sm font-semibold">Updated query</div>
          <ScrollArea className="h-[225px] px-4 py-2">
            {isLoading && <GenericSkeletonLoader />}
            {isSuccess && (
              <SimpleCodeBlock>
                {`create view ${table.schema}.${table.name} with (security_invoker = on) as\n ${data}`}
              </SimpleCodeBlock>
            )}
          </ScrollArea>
        </div>
      </div>
    </ConfirmationModal>
  )
}
