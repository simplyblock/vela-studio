import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateDatabaseMenu = (
  slug: string,
  project?: Project,
  branchRef?: string,
  flags?: {
    pitrEnabled: boolean
    showPgReplicate: boolean
    showRoles: boolean
  }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const {
    pitrEnabled,
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
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/schemas`,
          items: [],
        },
        { name: 'Tables', key: 'tables', url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/tables`, items: [] },
        {
          name: 'Functions',
          key: 'functions',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/functions`,
          items: [],
        },
        {
          name: 'Triggers',
          key: 'triggers',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/triggers`,
          items: [],
        },
        {
          name: 'Enumerated Types',
          key: 'types',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/types`,

          items: [],
        },
        {
          name: 'Extensions',
          key: 'extensions',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/extensions`,
          items: [],
        },
        {
          name: 'Indexes',
          key: 'indexes',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/indexes`,
          items: [],
        },
        {
          name: 'Publications',
          key: 'publications',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/publications`,
          items: [],
        },
        ...(showPgReplicate
          ? [
              {
                name: 'Replication',
                key: 'replication',
                url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/replication`,
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
          ? [{ name: 'Roles', key: 'roles', url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/roles`, items: [] }]
          : []),
        ...(columnLevelPrivileges
          ? [
              {
                name: 'Column Privileges',
                key: 'column-privileges',
                url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/column-privileges`,
                items: [],
                label: 'ALPHA',
              },
            ]
          : []),
        { name: 'Settings', key: 'settings', url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/settings`, items: [] },
      ],
    },
    {
      title: 'Platform',
      items: [
        { // FIXME: Backups are only enabled for now
          name: 'Backups',
          key: 'backups',
          url: pitrEnabled
            ? `/org/${slug}/project/${ref}/branch/${branchRef}/database/backups/pitr`
            : `/org/${slug}/project/${ref}/branch/${branchRef}/database/backups/scheduled`,
          items: [],
        },
        {
          name: 'Migrations',
          key: 'migrations',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/database/migrations`,
          items: [],
        },
      ],
    },
  ]
}
