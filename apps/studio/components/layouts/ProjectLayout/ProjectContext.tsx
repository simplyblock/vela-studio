import { PropsWithChildren, useEffect } from 'react'

import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { DatabaseSelectorStateContextProvider } from 'state/database-selector'
import { RoleImpersonationStateContextProvider } from 'state/role-impersonation-state'
import { StorageExplorerStateContextProvider } from 'state/storage-explorer'
import { TableEditorStateContextProvider } from 'state/table-editor'
import { TabsStateContextProvider } from 'state/tabs'
import { useBranchesQuery } from '../../../data/branches/branches-query'
import { useQueryClient } from '@tanstack/react-query'
import { branchKeys } from '../../../data/branches/keys'

type ProjectContextProviderProps = {
  projectRef: string | undefined
}

export const ProjectContextProvider = ({
  projectRef,
  children,
}: PropsWithChildren<ProjectContextProviderProps>) => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { data: branches } = useBranchesQuery(
    { orgRef: project?.organization_id, projectRef: project?.id },
    { enabled: !!project?.id }
  )

  useEffect(() => {
    if (branches && branches.length > 0) {
      branches.forEach((branch) => {
        queryClient.setQueryData(
          branchKeys.detail(project?.organization_id, project?.id, branch.id),
          branch
        )
      })
    }
  }, [branches])

  return (
    <TableEditorStateContextProvider key={`table-editor-state-${projectRef}`}>
      <TabsStateContextProvider key={`tabs-state-${projectRef}`}>
        <StorageExplorerStateContextProvider key={`storage-explorer-state-${projectRef}`}>
          <DatabaseSelectorStateContextProvider key={`database-selector-state-${projectRef}`}>
            <RoleImpersonationStateContextProvider key={`role-impersonation-state-${projectRef}`}>
              {children}
            </RoleImpersonationStateContextProvider>
          </DatabaseSelectorStateContextProvider>
        </StorageExplorerStateContextProvider>
      </TabsStateContextProvider>
    </TableEditorStateContextProvider>
  )
}

export const useIsProjectActive = () => {
  const { data: project } = useSelectedProjectQuery()
  return project?.status === PROJECT_STATUS.STARTED
}
