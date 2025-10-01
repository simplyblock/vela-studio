import { useParams } from 'common'
import { COMMAND_MENU_SECTIONS } from 'components/interfaces/App/CommandMenu/CommandMenu.utils'
import type { CommandOptions } from 'ui-patterns/CommandMenu'
import { useRegisterCommands } from 'ui-patterns/CommandMenu'

export function useProjectSettingsGotoCommands(options?: CommandOptions) {
  let { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  ref ||= '_'

  useRegisterCommands(
    COMMAND_MENU_SECTIONS.NAVIGATE,
    [
      {
        id: 'nav-project-settings-general',
        name: 'General Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-database',
        name: 'Database Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/settings`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-auth',
        name: 'Auth Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/auth/providers`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-api',
        name: 'API Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/api`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-storage',
        name: 'Storage Settings',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/storage/settings`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-custom-domains',
        name: 'Custom Domains',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#custom-domains`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-restart-project',
        name: 'Restart project',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#restart-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-pause-project',
        name: 'Pause project',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#pause-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-transfer-project',
        name: 'Transfer project',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#transfer-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-delete-project',
        name: 'Delete project',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#delete-project`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-database-password',
        name: 'Database password',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#database-password`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-string',
        name: 'Connection string',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#connection-string`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-connection-pooling',
        name: 'Connection pooling',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#connection-pooling`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-ssl-configuration',
        name: 'SSL configuration',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general#ssl-configuration`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-network-restrictions',
        name: 'Network restrictions',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/settings#network-restrictions`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-banned-ips',
        name: 'Banned IPs',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/settings#banned-ips`,
        defaultHidden: true,
      },
      {
        id: 'nav-project-settings-log-drains',
        name: 'Log drains',
        route: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/log-drains`,
        defaultHidden: true,
      },
    ],
    { ...options, deps: [ref] }
  )
}
