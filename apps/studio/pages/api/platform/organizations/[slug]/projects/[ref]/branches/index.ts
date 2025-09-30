import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

interface DatabaseInformation {
  host: string
  port: number
  username: string
  name: string
  password?: string // only at creation time
  encrypted_connection_string: string
  service_endpoint_uri: string
  version: string
}

interface Branch {
  id: number
  name: string
  slug: string
  project_slug: string
  organization_slug: string
  database: DatabaseInformation & {
    has_replicas: boolean
  }
  pitr_enabled: boolean
  assigned_labels: string[]
  used_resources: {
    vcpu: number
    ram_mb: number
    nvme_gb: number
    iops: number
    storage_gb?: number
  }
  max_resources: {
    vcpu: number
    ram_mb: number
    nvme_gb: number
    iops: number
    storage_gb?: number
  }
  api_keys: {
    anon: string
    service_role: string
  }
  status: {
    database:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UPDATING'
      | 'RESTARTING'
      | 'STOPPING'
      | 'UNKNOWN'
    storage:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UNKNOWN'
    realtime:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UNKNOWN'
  }
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}

const handleGet = (req: NextApiRequest, res: NextApiResponse<Branch[]>) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')

  return res.status(200).json([
    {
      id: 1,
      created_at: '2022-01-01T00:00:00Z',
      created_by: 'me',
      name: 'main',
      slug: 'main',
      project_slug: ref,
      organization_slug: slug,
      status: {
        database: 'ACTIVE_HEALTHY',
        realtime: 'STOPPED',
        storage: 'STOPPED',
      },
      database: {} as any,
      pitr_enabled: true,
      assigned_labels: [],
      used_resources: {
        vcpu: 0,
        ram_mb: 0,
        nvme_gb: 0,
        iops: 0,
        storage_gb: undefined,
      },
      max_resources: {
        vcpu: 0,
        ram_mb: 0,
        nvme_gb: 0,
        iops: 0,
        storage_gb: undefined,
      },
      api_keys: {
        anon: '',
        service_role: '',
      },
    },
  ])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
