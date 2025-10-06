import { useParams } from 'common'
import { GridFooter } from 'components/ui/GridFooter'
import TwoOptionToggle from 'components/ui/TwoOptionToggle'
import { useTableEditorQuery } from 'data/table-editor/table-editor-query'
import { isTableLike, isViewLike } from 'data/table-editor/table-editor-types'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useUrlState } from 'hooks/ui/useUrlState'
import RefreshButton from '../header/RefreshButton'
import { Pagination } from './pagination'
import { useBranchQuery } from 'data/branches/branch-query'

export interface FooterProps {
  isRefetching?: boolean
}

const Footer = ({ isRefetching }: FooterProps) => {
  const { id: _id, slug: orgRef, branch: branchRef } = useParams()
  const id = _id ? Number(_id) : undefined
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useBranchQuery({orgRef, projectRef: project?.ref, branchRef})

  const { data: entity } = useTableEditorQuery({
    projectRef: project?.ref,
    connectionString: branch?.database.encrypted_connection_string,
    id,
  })

  const [{ view: selectedView = 'data' }, setUrlState] = useUrlState()

  const setSelectedView = (view: string) => {
    if (view === 'data') {
      setUrlState({ view: undefined })
    } else {
      setUrlState({ view })
    }
  }

  const isViewSelected = isViewLike(entity)
  const isTableSelected = isTableLike(entity)

  return (
    <GridFooter>
      {selectedView === 'data' && <Pagination />}

      <div className="ml-auto flex items-center gap-x-2">
        {entity && selectedView === 'data' && (
          <RefreshButton tableId={entity.id} isRefetching={isRefetching} />
        )}

        {(isViewSelected || isTableSelected) && (
          <TwoOptionToggle
            width={75}
            options={['definition', 'data']}
            activeOption={selectedView}
            borderOverride="border"
            onClickOption={setSelectedView}
          />
        )}
      </div>
    </GridFooter>
  )
}

export default Footer
