import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (
  slug: string,
  project: Project,
  branchRef: string,
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Tools',
      items: [
        {
          name: 'Inspector',
          key: 'inspector',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/realtime/inspector`,
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
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/realtime/policies`,
          items: [],
        },
        {
          name: 'Settings',
          key: 'settings',
          url: `/org/${slug}/project/${ref}/branch/${branchRef}/realtime/settings`,
          items: [],
        },
      ],
    },
  ]
}
