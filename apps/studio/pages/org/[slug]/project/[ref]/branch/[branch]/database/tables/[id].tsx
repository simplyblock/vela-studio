import { ChevronRight } from 'lucide-react'

import { useParams } from 'common'
import { ColumnList } from 'components/interfaces/Database/Tables/ColumnList'
import { SidePanelEditor } from 'components/interfaces/TableGridEditor'
import DeleteConfirmationDialogs from 'components/interfaces/TableGridEditor/DeleteConfirmationDialogs'
import DatabaseLayout from 'components/layouts/DatabaseLayout/DatabaseLayout'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { ScaffoldContainer, ScaffoldSection } from 'components/layouts/Scaffold'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike } from 'data/table-editor/table-editor-types'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { TableEditorTableStateContextProvider } from 'state/table-editor-table'
import type { NextPageWithLayout } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

const DatabaseTables: NextPageWithLayout = () => {
  const snap = useTableEditorStateSnapshot()

  const { id: _id } = useParams()
  const id = _id ? Number(_id) : undefined

  const { data: branch } = useSelectedBranchQuery()
  const { data: selectedTable, isLoading } = useTableEditorQuery({
    branch,
    id,
  })

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection>
          <div className="col-span-12 space-y-6">
            <div className="flex items-center space-x-2">
              <FormHeader className="!mb-0 !w-fit !whitespace-nowrap" title="Database Tables" />
              <ChevronRight size={18} strokeWidth={1.5} className="text-foreground-light" />
              {isLoading ? (
                <ShimmeringLoader className="w-40" />
              ) : (
                <FormHeader className="!mb-0" title={selectedTable?.name ?? ''} />
              )}
            </div>
            <ColumnList
              onAddColumn={snap.onAddColumn}
              onEditColumn={snap.onEditColumn}
              onDeleteColumn={snap.onDeleteColumn}
            />
          </div>
        </ScaffoldSection>
      </ScaffoldContainer>

      {branch && selectedTable !== undefined && isTableLike(selectedTable) && (
        <TableEditorTableStateContextProvider
          key={`table-editor-table-${selectedTable.id}`}
          branch={branch}
          table={selectedTable}
        >
          <DeleteConfirmationDialogs selectedTable={selectedTable} />
          <SidePanelEditor includeColumns selectedTable={selectedTable} />
        </TableEditorTableStateContextProvider>
      )}
    </>
  )
}

DatabaseTables.getLayout = (page) => (
  <DefaultLayout>
    <DatabaseLayout title="Database">{page}</DatabaseLayout>
  </DefaultLayout>
)

export default DatabaseTables
