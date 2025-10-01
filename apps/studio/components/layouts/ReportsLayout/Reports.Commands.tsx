import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useReportsGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-reports',
        name: 'Reports',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-api',
        name: 'API Reports',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports/api-overview`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-storage',
        name: 'Storage Reports',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports/storage`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-database',
        name: 'Database Reports',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports/database`,
        defaultHidden: true,
      },
      {
        id: 'nav-reports-query-performance',
        name: 'Query Performance Reports',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/reports/query-performance`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [orgRef, projectRef, branchRef] }
  )
}
