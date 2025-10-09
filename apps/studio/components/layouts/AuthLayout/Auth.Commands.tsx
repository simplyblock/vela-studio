import { Lock } from 'lucide-react'

import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'
import { orderCommandSectionsByPriority } from 'components/interfaces/App/CommandMenu/ordering'
import { useParams } from 'common'

export function useAuthGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  projectRef ||= '_'

  useRegisterCommands(
    'Actions',
    [
      {
        id: 'create-rls-policy',
        name: 'Create RLS policy',
        value: 'Create RLS (Row Level Security) policy',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/policies`,
        icon: () => <Lock />,
      },
    ],
    {
      ...options,
      deps: [orgRef, projectRef, branchRef],
      enabled: (options?.enabled ?? true) && projectRef !== '_',
      orderSection: orderCommandSectionsByPriority,
      sectionMeta: { priority: 3 },
    }
  )

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-auth-users',
        name: 'Users',
        value: 'Auth: Users',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/users`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-policies',
        name: 'Policies',
        value: 'Auth: Policies (RLS)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/policies`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers',
        value: 'Auth: Providers (Social Login, SSO)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-providers',
        name: 'Providers (Third Party)',
        value: 'Auth: Providers (Third Party)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/third-party`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-sessions',
        name: 'Sessions',
        value: 'Auth: Sessions (User Sessions)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/sessions`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-rate-limits',
        name: 'Rate Limits',
        value: 'Auth: Rate Limits',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/rate-limits`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-templates',
        name: 'Email Templates',
        value: 'Auth: Email Templates',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/templates`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-mfa',
        name: 'Multi Factor Authentication (MFA)',
        value: 'Auth: Multi Factor Authenticaiton (MFA)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/mfa`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-url-configuration',
        name: 'URL Configuration',
        value: 'Auth: URL Configuration (Site URL, Redirect URLs)',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/url-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-attack-protection',
        name: 'Attack Protection',
        value: 'Auth: Attack Protection',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/protection`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-auth-hooks',
        name: 'Auth Hooks',
        value: 'Auth: Auth Hooks',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/hooks`,
        defaultHidden: true,
      },
      {
        id: 'nav-auth-advanced-settings',
        name: 'Auth Advanced Settings',
        value: 'Auth: Advanced Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/advanced`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [orgRef, projectRef, branchRef] }
  )
}
