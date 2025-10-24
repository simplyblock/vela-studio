import { useState } from 'react'
import { CreateFunction, DeleteFunction } from 'components/interfaces/Database'
import FunctionsList from 'components/interfaces/Database/Functions/FunctionsList/FunctionsList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import { DatabaseFunction } from 'data/database-functions/database-functions-query'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const DatabaseFunctionsPage: NextPageWithLayout = () => {
  const [selectedFunction, setSelectedFunction] = useState<DatabaseFunction | undefined>()
  const [showCreateFunctionForm, setShowCreateFunctionForm] = useState(false)
  const [showDeleteFunctionForm, setShowDeleteFunctionForm] = useState(false)

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)
  const { can: canReadFunctions, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:edge:read")

  const createFunction = () => {
    setEditorPanelOpen(true)
  }

  const editFunction = (fn: DatabaseFunction) => {
    setEditorPanelOpen(true)
  }

  const deleteFunction = (fn: any) => {
    setSelectedFunction(fn)
    setShowDeleteFunctionForm(true)
  }

  if (isPermissionsLoaded && !canReadFunctions) {
    return <NoPermission isFullPage resourceText="view database functions" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader
              title="Database Functions"
              docsUrl="https://supabase.com/docs/guides/database/functions"
            />
            <FunctionsList
              createFunction={createFunction}
              editFunction={editFunction}
              deleteFunction={deleteFunction}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <CreateFunction
        func={selectedFunction}
        visible={showCreateFunctionForm}
        setVisible={setShowCreateFunctionForm}
      />
      <DeleteFunction
        func={selectedFunction}
        visible={showDeleteFunctionForm}
        setVisible={setShowDeleteFunctionForm}
      />

      <EditorPanel
        open={editorPanelOpen}
        onRunSuccess={() => {
          setEditorPanelOpen(false)
        }}
        onClose={() => {
          setEditorPanelOpen(false)
        }}
        initialValue={
          `create function function_name()
returns void
language plpgsql
as $$
begin
  -- Write your function logic here
end;
$$;`
        }
        label='Create new database function'
        initialPrompt='Create a new database function that...'
      />
    </>
  )
}

DatabaseFunctionsPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseFunctionsPage
