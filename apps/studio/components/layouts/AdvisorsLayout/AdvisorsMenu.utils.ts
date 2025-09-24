import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateAdvisorsMenu = (
  slug: string,
  project?: Project,
  features?: { advisorRules: boolean }
): ProductMenuGroup[] => {
  const ref = project?.ref ?? 'default'

  return [
    {
      title: 'Advisors',
      items: [
        {
          name: 'Security Advisor',
          key: 'security',
          url: `/org/${slug}/project/${ref}/advisors/security`,
          items: [],
        },
        {
          name: 'Performance Advisor',
          key: 'performance',
          url: `/org/${slug}/project/${ref}/advisors/performance`,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/org/${slug}/project/${ref}/advisors/query-performance`,
          items: [],
        },
      ],
    },
    ...(features?.advisorRules
      ? [
          {
            title: 'Configuration',
            items: [
              {
                name: 'Settings',
                key: 'rules',
                url: `/org/${slug}/project/${ref}/advisors/rules/security`,
                items: [],
              },
            ],
          },
        ]
      : []),
  ]
}
