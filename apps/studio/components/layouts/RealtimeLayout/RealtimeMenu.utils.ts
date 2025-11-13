import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { ProjectDetail } from 'data/projects/project-detail-query'

export const generateRealtimeMenu = (
  slug: string,
  project: ProjectDetail,
  branchRef: string,
): ProductMenuGroup[] => {
  const ref = project?.id ?? 'default'

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
          name: 'RLS Policies',
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
