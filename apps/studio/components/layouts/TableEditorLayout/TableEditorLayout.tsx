import { PropsWithChildren } from 'react'
import NoPermission from 'components/ui/NoPermission'
import { ProjectLayoutWithAuth } from '../ProjectLayout/ProjectLayout'
import { useCheckPermissions } from '../../../hooks/misc/useCheckPermissions'

const TableEditorLayout = ({ children }: PropsWithChildren<{}>) => {
  const { can: canReadTables, isSuccess: isPermissionsLoaded } = useCheckPermissions("branch:settings:read")

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
