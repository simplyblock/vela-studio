import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { ProjectDetail } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants'

export const generateSettingsMenu = (
  orgRef: string,
  projectRef?: string,
  branchRef?: string,
  project?: ProjectDetail,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
  }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.STARTING
  const buildingUrl = `/org/${orgRef}/project/${projectRef}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true

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
        {
          name: 'Compute and Disk',
          key: 'compute-and-disk',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/compute-and-disk`,
          items: [],
        },
        {
          name: 'Infrastructure',
          key: 'infrastructure',
          url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/sbranch/${branchRef}/ettings/infrastructure`,
          items: [],
        },
        // FIXME: Potentially move below
        {
          name: 'Integrations',
          key: 'integrations',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/branch/${branchRef}/settings/integrations`,
          items: [],
        },
        {
          name: `Log Drains`,
          key: `log-drains`,
          url: `/project/${projectRef}/branch/${branchRef}/settings/log-drains`,
          items: [],
        },
        {
          name: 'Data API',
          key: 'api',
          url: isProjectBuilding ? buildingUrl : `/project/${projectRef}/branch/${branchRef}/settings/api`,
          items: [],
        },
        {
          name: 'API Keys',
          key: 'api-keys',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/api-keys`,
          items: [],
          label: 'NEW',
        },
        {
          name: 'JWT Keys',
          key: 'jwt',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/jwt`,
          items: [],
          label: 'NEW',
        }, // FIXME: potentially move above
        {
          name: 'Add Ons',
          key: 'addons',
          url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/addons`,
          items: [],
        },
      ],
    },
  ]
}
