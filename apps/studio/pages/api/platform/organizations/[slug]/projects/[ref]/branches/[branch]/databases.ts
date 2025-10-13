import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'

interface ResponseData {
  /** @enum {string} */
  cloud_provider: 'AWS' | 'FLY' | 'AWS_K8S' | 'AWS_NIMBUS'
  /** @default null */
  connection_string_read_only?: string | null
  connectionString: string
  /** @default null */
  db_host: string
  db_name: string
  db_port: number
  db_user: string
  identifier: string
  inserted_at: string
  region: string
  restUrl: string
  size: string
  /** @enum {string} */
  status:
    | 'ACTIVE_HEALTHY'
    | 'ACTIVE_UNHEALTHY'
    | 'COMING_UP'
    | 'GOING_DOWN'
    | 'INIT_FAILED'
    | 'REMOVED'
    | 'RESTORING'
    | 'UNKNOWN'
    | 'INIT_READ_REPLICA'
    | 'INIT_READ_REPLICA_FAILED'
    | 'RESTARTING'
    | 'RESIZING'
}

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse<ResponseData[]>) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)
  const { data, success } = await client.getOrFail(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
    }
  )

  if (!success) return

  return res.status(200).json([
    {
      cloud_provider: 'localhost' as any,
      db_host: data.database.host,
      db_name: data.database.name,
      db_port: data.database.port,
      db_user: data.database.username,
      identifier: branch,
      inserted_at: '',
      region: 'local',
      restUrl: `${data.database.service_endpoint_uri}/rest`,
      size: `${data.used_resources.nvme_bytes}`,
      status: 'ACTIVE_HEALTHY',// data.service_health.database as any,
      connectionString: data.database.encrypted_connection_string,
      connection_string_read_only: data.database.encrypted_connection_string
    },
  ])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
