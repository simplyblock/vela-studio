import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useAdvisorsGoToCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-advisors-security',
        name: 'Security Advisor',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/security`,
        defaultHidden: true,
      },
      {
        id: 'nav-advisors-performance',
        name: 'Performance Advisor',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/performance`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [orgRef, projectRef, branchRef] }
  )
}
