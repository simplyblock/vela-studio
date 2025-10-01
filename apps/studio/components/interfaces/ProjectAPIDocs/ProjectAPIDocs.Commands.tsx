import { useParams } from 'common'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { COMMAND_MENU_SECTIONS } from '../App/CommandMenu/CommandMenu.utils'

export function useApiDocsGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-api',
        name: 'Project API Docs',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-auth',
        name: 'Auth Docs',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api?page=auth`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-user-management',
        name: 'User Management Docs',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api?page=users-management`,
        defaultHidden: true,
      },
      {
        id: 'nav-api-graphql',
        name: 'GraphQL Docs',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/api/graphiql`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [orgRef, projectRef, branchRef] }
  )
}
