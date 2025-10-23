import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'

export const generateAdvisorsMenu = (
  orgRef: string,
  project?: Project,
  branchRef?: string,
): ProductMenuGroup[] => {
  const projectRef = project?.ref ?? 'default'

  return [
    {
      title: 'Advisors',
      items: [
        {
          name: 'Security Advisor',
          key: 'security',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/security`,
          items: [],
        },
        {
          name: 'Performance Advisor',
          key: 'performance',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/performance`,
          items: [],
        },
        {
          name: 'Query Performance',
          key: 'query-performance',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/query-performance`,
          items: [],
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Settings',
          key: 'rules',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/advisors/rules/security`,
          items: [],
        },
      ],
    },
  ]
}
