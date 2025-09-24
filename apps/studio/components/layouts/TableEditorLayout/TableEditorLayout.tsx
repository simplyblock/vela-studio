import { PropsWithChildren } from 'react'
import NoPermission from 'components/ui/NoPermission'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const isPermissionsLoaded = true
  // FIXME: need permission implemented 
  const canReadTables = true

  if (isPermissionsLoaded && !canReadTables) {
    return (
      <ProjectLayoutWithAuth isBlocking={false}>
        <NoPermission isFullPage resourceText="view tables from this project" />
      </ProjectLayoutWithAuth>
    )
  }

  return children
}

export default TableEditorLayout
