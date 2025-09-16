import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateDatabaseMenu = (
  slug: string,
  project?: Project,
  flags?: {
    pgNetExtensionExists: boolean
    pitrEnabled: boolean
    columnLevelPrivileges: boolean
    enablePgReplicate: boolean
    showPgReplicate: boolean
    showRoles: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const {
    pgNetExtensionExists,
    pitrEnabled,
    enablePgReplicate,
    showPgReplicate,
    showRoles,
  } = flags || {}

  // Disable CLP for now
  const columnLevelPrivileges = false;

  return [
    {
      title: 'Database Management',
      items: [
        {
          name: 'Schema Visualizer',
          key: 'schemas',
          url: `/org/${slug}/project/${ref}/database/schemas`,
          items: [],
        },
        { name: 'Tables', key: 'tables', url: `/org/${slug}/project/${ref}/database/tables`, items: [] },
        {
          name: 'Functions',
          key: 'functions',
          url: `/org/${slug}/project/${ref}/database/functions`,
          items: [],
        },
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/org/${slug}/project/${ref}/database/triggers`,
          items: [],
        },
        {
          name: 'Enumerated Types',
          key: 'types',
          url: `/org/${slug}/project/${ref}/database/types`,

          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/org/${slug}/project/${ref}/database/extensions`,
          items: [],
        },
        {
          name: 'Indexes',
          key: 'indexes',
          url: `/org/${slug}/project/${ref}/database/indexes`,
          items: [],
        },
        {
          name: 'Publications',
          key: 'publications',
          url: `/org/${slug}/project/${ref}/database/publications`,
          items: [],
        },
        ...(showPgReplicate
          ? [
              {
                name: 'Replication',
                key: 'replication',
                url: `/org/${slug}/project/${ref}/database/replication`,
                label: !enablePgReplicate ? 'Coming soon' : undefined,
                items: [],
              },
            ]
          : []),
      ],
    },
    {
      title: 'Configuration',
      items: [
        ...(showRoles
          ? [{ name: 'Roles', key: 'roles', url: `/org/${slug}/project/${ref}/database/roles`, items: [] }]
          : []),
        ...(columnLevelPrivileges
          ? [
              {
                name: 'Column Privileges',
                key: 'column-privileges',
                url: `/org/${slug}/project/${ref}/database/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        { name: 'Settings', key: 'settings', url: `/org/${slug}/project/${ref}/database/settings`, items: [] },
      ],
    },
    {
      title: 'Platform',
      items: [
        { // FIXME: Backups are only enabled for now
          name: 'Backups',
          key: 'backups',
          url: pitrEnabled
            ? `/org/${slug}/project/${ref}/database/backups/pitr`
            : `/org/${slug}/project/${ref}/database/backups/scheduled`,
          items: [],
        },
        {
          name: 'Migrations',
          key: 'migrations',
          url: `/org/${slug}/project/${ref}/database/migrations`,
          items: [],
        },
      ],
    },
  ]
}
