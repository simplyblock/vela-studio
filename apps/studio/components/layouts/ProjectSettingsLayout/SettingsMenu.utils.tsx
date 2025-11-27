import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { ProjectDetail } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants'

export const generateSettingsMenu = (
  orgRef: string,
  projectRef?: string,
  branchRef?: string,
  project?: ProjectDetail,
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.STARTING
  const buildingUrl = `/org/${orgRef}/project/${projectRef}`

  return [
    {
      title: 'Branch Settings',
      items: [
        {
          name: 'General',
          key: 'general',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/general`,
          items: [],
        },
        /*{
          name: 'Infrastructure',
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/infrastructure`,
          items: [],
        },*/
        /*{
          name: `Log Drains`,
          key: `log-drains`,
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/log-drains`,
          items: [],
        },*/
        {
          name: 'Data API',
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/api`,
          items: [],
        },
        {
          name: 'API Keys',
          key: 'api-keys',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/api-keys`,
          items: [],
        },
        {
          name: 'JWT Keys',
          key: 'jwt',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/jwt`,
          items: [],
        }, // FIXME: potentially move above
      ],
    },
  ]
}
