import { Blocks, Code, Database, History, Search } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { useParams } from 'common'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'

export function useDatabaseGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.QUERY,
    [
      {
        id: 'run-sql',
        name: 'Run SQL',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/sql/new`,
        icon: () => <Code />,
      },
    ],
    {
      ...options,
      deps: [orgRef, projectRef, branchRef],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 2 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-database-tables',
        name: 'Tables',
        value: 'Database: Tables',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/tables`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-triggers',
        name: 'Triggers',
        value: 'Database: Triggers',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/triggers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-functions',
        name: 'Functions',
        value: 'Database: Functions',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/functions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-extensions',
        name: 'Extensions',
        value: 'Database: Extensions',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/extensions`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-roles',
        name: 'Roles',
        value: 'Database: Roles',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/roles`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-replication',
        name: 'Replication',
        value: 'Database: Replication',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/replication`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-hooks',
        name: 'Webhooks',
        value: 'Database: Webhooks',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/integrations/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-backups',
        name: 'Backups',
        value: 'Database: Backups',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/scheduled`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-wrappers',
        name: 'Wrappers',
        value: 'Database: Wrappers',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/integrations/wrappers`,
        defaultHidden: true,
      },
      {
        id: 'nav-database-migrations',
        name: 'Migrations',
        value: 'Database: Migrations',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/migrations`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [projectRef, orgRef, branchRef] }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.DATABASE,
    [
      {
        id: 'run-schema-visualizer',
        name: 'View your schemas',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/schemas`,
        icon: () => <Search />,
      },
      {
        id: 'run-view-database-functions',
        name: 'View and create functions',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/functions`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-triggers',
        name: 'View and create triggers',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/triggers`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-enumerated-types',
        name: 'View and create enumerated types',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/types`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-extensions',
        name: 'View your extensions',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/extensions`,
        icon: () => <Blocks />,
      },
      {
        id: 'run-view-database-indexes',
        name: 'View and create indexes',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/indexes`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-roles',
        name: 'View your roles',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/roles`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-backups',
        name: 'View your backups',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/backups/scheduled`,
        icon: () => <Database />,
      },
      {
        id: 'run-view-database-migrations',
        name: 'View your migrations',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/migrations`,
        icon: () => <History />,
      },
    ],
    {
      ...options,
      deps: [orgRef, projectRef, branchRef],
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )
}
