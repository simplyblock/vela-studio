import { ArrowUpRight } from 'lucide-react'

import type { ProductMenuGroup } from 'components/ui/ProductMenu/ProductMenu.types'
import type { Project } from 'data/projects/project-detail-query'
import { PROJECT_STATUS } from 'lib/constants'

export const generateSettingsMenu = (
  orgRef: string,
  projectRef?: string,
  branchRef?: string,
  project?: Project,
  features?: {
    auth?: boolean
    edgeFunctions?: boolean
    storage?: boolean
  }
): ProductMenuGroup[] => {
  const isProjectBuilding = project?.status === PROJECT_STATUS.COMING_UP
  const buildingUrl = `/org/${orgRef}/project/${projectRef}`

  const authEnabled = features?.auth ?? true
  const edgeFunctionsEnabled = features?.edgeFunctions ?? true
  const storageEnabled = features?.storage ?? true

  return [
    {
      title: 'Project Settings',
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
        {
          name: 'Vault',
          key: 'vault',
          url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/integrations/vault/overview`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
          label: 'Alpha',
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        {
          name: 'Database',
          key: 'database',
          url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/database/settings`,
          items: [],
          rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
        },
        ...(authEnabled
          ? [
              {
                name: 'Authentication',
                key: 'auth',
                url: isProjectBuilding ? buildingUrl : `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/settings/auth`,
                items: [],
              },
            ]
          : []),
        ...(storageEnabled
          ? [
              {
                name: 'Storage',
                key: 'storage',
                url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/storage/settings`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
        ...(edgeFunctionsEnabled
          ? [
              {
                name: 'Edge Functions',
                key: 'functions',
                url: `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/functions/secrets`,
                items: [],
                rightIcon: <ArrowUpRight strokeWidth={1} className="h-4 w-4" />,
              },
            ]
          : []),
      ],
    },
  ]
}
