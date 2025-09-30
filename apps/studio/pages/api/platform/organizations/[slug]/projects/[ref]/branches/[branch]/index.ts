import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../../../../lib/api/apiBuilder'
import { getPlatformQueryParams } from '../../../../../../../../../lib/api/platformQueryParams'
import { getServerSession } from 'next-auth'

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

const handleGet = async (req: NextApiRequest, res: NextApiResponse<Branch>) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  return res.status(200).json({
    assigned_labels: [],
    created_at: '',
    created_by: '',
    database: {} as any,
    id: 0,
    name: 'main',
    organization_slug: slug,
    pitr_enabled: false,
    project_slug: ref,
    slug: 'main',
    status: {
      database: 'ACTIVE_HEALTHY',
      realtime: 'STOPPED',
      storage: 'STOPPED',
    },
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
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
