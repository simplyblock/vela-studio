import { Table2 } from 'lucide-react'

import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useProjectLevelTableEditorCommands(options?: CommandOptions) {
  const { data: project } = useSelectedProjectQuery()
  const { slug: orgRef, branch: branchRef } = useParams()
  const projectRef = project?.ref || '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.TABLE,
    [
      {
        id: 'create-table',
        name: 'Create new table',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor?create=table`,
        icon: () => <Table2 />,
      },
    ],
    {
      ...options,
      deps: [orgRef, projectRef, branchRef],
      enabled: (options?.enabled ?? true) && !!project,
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}

export function useTableEditorGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.TABLE,
    [
      {
        id: 'view-tables',
        name: 'View your tables',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`,
        icon: () => <Table2 />,
      },
    ],
    {
      ...options,
      deps: [orgRef, projectRef, branchRef],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-table-editor',
        name: 'Table Editor',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [orgRef, projectRef, branchRef] }
  )
}
