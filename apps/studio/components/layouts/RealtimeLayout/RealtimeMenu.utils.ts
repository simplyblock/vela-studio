import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (
  slug: string,
  project: Project,
  flags?: { enableRealtimeSettings: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'
  const { enableRealtimeSettings } = flags || {}

  return [
    {
      title: 'Tools',
      items: [
        {
          name: 'Inspector',
          key: 'inspector',
          url: `/org/${slug}/project/${ref}/realtime/inspector`,
          items: [],
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Policies',
          key: 'policies',
          url: `/org/${slug}/project/${ref}/realtime/policies`,
          items: [],
        },
        ...(enableRealtimeSettings
          ? [
              {
                name: 'Settings',
                key: 'settings',
                url: `/org/${slug}/project/${ref}/realtime/settings`,
                items: [],
              },
            ]
          : []),
      ],
    },
  ]
}
