import { PostgresTrigger } from '@supabase/postgres-meta'
import { useState } from 'react'
import { DeleteTrigger } from 'components/interfaces/Database/Triggers/DeleteTrigger'
import { TriggerSheet } from 'components/interfaces/Database/Triggers/TriggerSheet'
import TriggersList from 'components/interfaces/Database/Triggers/TriggersList/TriggersList'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { EditorPanel } from 'components/ui/EditorPanel/EditorPanel'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import NoPermission from 'components/ui/NoPermission'
import type { NextPageWithLayout } from 'types'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

const TriggersPage: NextPageWithLayout = () => {
  const [selectedTrigger, setSelectedTrigger] = useState<PostgresTrigger>()
  const [showCreateTriggerForm, setShowCreateTriggerForm] = useState<boolean>(false)
  const [showDeleteTriggerForm, setShowDeleteTriggerForm] = useState<boolean>(false)

  // Local editor panel state
  const [editorPanelOpen, setEditorPanelOpen] = useState(false)

  const { can: canReadTriggers, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:read")

  const createTrigger = () => {
    setEditorPanelOpen(true)
  }

  const editTrigger = (trigger: PostgresTrigger) => {
    setEditorPanelOpen(true)
  }

  const deleteTrigger = (trigger: PostgresTrigger) => {
    setSelectedTrigger(trigger)
    setShowDeleteTriggerForm(true)
  }

  if (isPermissionsLoaded && !canReadTriggers) {
    return <NoPermission isFullPage resourceText="view database triggers" />
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12">
            <FormHeader
              title="Database Triggers"
              description="Execute a set of actions automatically on specified table events"
              docsUrl="https://supabase.com/docs/guides/database/postgres/triggers"
            />
            <TriggersList
              createTrigger={createTrigger}
              editTrigger={editTrigger}
              deleteTrigger={deleteTrigger}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>
      <TriggerSheet
        selectedTrigger={selectedTrigger}
        open={showCreateTriggerForm}
        setOpen={setShowCreateTriggerForm}
      />
      <DeleteTrigger
        trigger={selectedTrigger}
        visible={showDeleteTriggerForm}
        setVisible={setShowDeleteTriggerForm}
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
          `create trigger trigger_name
after insert or update or delete on table_name
for each row
execute function function_name();`
        }
        label='Create new database trigger'
        initialPrompt='Create a new database trigger that...'
      />
    </>
  )
}

TriggersPage.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default TriggersPage
