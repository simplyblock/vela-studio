import { NextApiRequest, NextApiResponse } from 'next'

import { paths } from 'api-types'
import apiWrapper from 'lib/api/apiWrapper'
import { PROJECT_REST_URL } from 'pages/api/constants'
import CryptoJS from 'crypto-js'
import { getPlatformQueryParams } from '../../../../../../../lib/api/platformQueryParams'

export default (req: NextApiRequest, res: NextApiResponse) => apiWrapper(req, res, handler)

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req

  switch (method) {
    case 'GET':
      return handleGet(req, res)
    default:
      res.setHeader('Allow', ['GET'])
      res.status(405).json({ data: null, error: { message: `Method ${method} Not Allowed` } })
  }
}

interface ResponseData {
  /** @enum {string} */
  cloud_provider: 'AWS' | 'FLY' | 'AWS_K8S' | 'AWS_NIMBUS'
  /** @default null */
  connection_string_read_only?: string | null
  /** @default null */
  connectionString?: string | null
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
  const encryptedConnectionString = CryptoJS.AES.encrypt(
    'postgresql://supabase_admin:your-super-secret-and-long-postgres-password@db:5432/postgres', 'SAMPLE_KEY'
  ).toString().trim() // FIXME: Encrypted connectionString needs to come from the outside

  const { ref } = getPlatformQueryParams(req, 'ref')
  return res.status(200).json([
    {
      cloud_provider: 'localhost' as any,
      connectionString: encryptedConnectionString,
      connection_string_read_only: encryptedConnectionString,
      db_host: '127.0.0.1',
      db_name: 'postgres',
      db_port: 5432,
      db_user: 'postgres',
      identifier: ref,
      inserted_at: '',
      region: 'local',
      restUrl: PROJECT_REST_URL,
      size: '',
      status: 'ACTIVE_HEALTHY',
    },
  ])
}
