import { PostgresPolicy } from '@supabase/postgres-meta'
import { useState } from 'react'

import Policies from 'components/interfaces/Auth/Policies/Policies'
import { PolicyEditorPanel } from 'components/interfaces/Auth/Policies/PolicyEditorPanel'
import AlertError from 'components/ui/AlertError'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useTablesQuery } from 'data/tables/tables-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useSelectedBranchQuery } from '../../../data/branches/selected-branch-query'

export const RealtimePolicies = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()

  const [showPolicyEditor, setShowPolicyEditor] = useState(false)
  const [selectedPolicyToEdit, setSelectedPolicyToEdit] = useState<PostgresPolicy>()

  const {
    data: tables,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: branch?.database.encrypted_connection_string,
    schema: 'realtime',
  })

  const filteredTables = (tables ?? []).filter((table) => table.name === 'messages')

  return (
    <div className="flex min-h-full w-full flex-col p-4 gap-y-4">
      <FormHeader
        className="!mb-0"
        title="Realtime policies"
        description="You can use RLS policies to control access to Realtime Channels"
      />

      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve tables" />}

      {isSuccess && (
        <div className="space-y-4">
          <Policies
            schema="realtime"
            tables={filteredTables}
            hasTables
            isLocked={false}
            onSelectCreatePolicy={() => {
              setSelectedPolicyToEdit(undefined)
              setShowPolicyEditor(true)
            }}
            onSelectEditPolicy={(policy) => {
              setSelectedPolicyToEdit(policy)
              setShowPolicyEditor(true)
            }}
          />
        </div>
      )}

      <PolicyEditorPanel
        visible={showPolicyEditor}
        searchString="messages"
        schema="realtime"
        selectedPolicy={selectedPolicyToEdit}
        onSelectCancel={() => setShowPolicyEditor(false)}
        authContext="realtime"
      />
    </div>
  )
}
