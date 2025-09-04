import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

interface GetResponse {
  connection_string: string
  db_dns_name: string
  db_host: string
  db_name: string
  db_port: number
  db_user: string
  default_pool_size?: number
  ignore_startup_parameters?: string
  inserted_at: string
  max_client_conn?: number
  pgbouncer_enabled: boolean
  /** @enum {string} */
  pgbouncer_status: 'COMING_UP' | 'COMING_DOWN' | 'RELOADING' | 'ENABLED' | 'DISABLED'
  /** @enum {string} */
  pool_mode: 'transaction' | 'session' | 'statement'
  query_wait_timeout?: number
  reserve_pool_size?: number
  server_idle_timeout?: number
  server_lifetime?: number
  ssl_enforced: boolean
}

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  const response: GetResponse = {
    ignore_startup_parameters: '',
    pool_mode: 'transaction',
    max_client_conn: 1000,
    default_pool_size: 20,
    db_name: '',
    db_host: '',
    db_port: 0,
    db_user: '',
    connection_string: '',
    db_dns_name: '',
    inserted_at: '',
    pgbouncer_enabled: false,
    pgbouncer_status: 'COMING_UP',
    ssl_enforced: false,
  }

  return res.status(200).json(response)
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  return res.status(200).json({
    ignore_startup_parameters: '',
    pool_mode: req.body.pool_mode ?? 'transaction',
    max_client_conn: req.body.max_client_conn ?? 1000,
    default_pool_size: req.body.default_pool_size ?? 20,
    min_pool_size: req.body.min_pool_size ?? 0,
    client_idle_timeout: req.body.client_idle_timeout ?? 0,
    application_name_add_host: req.body.application_name_add_host ?? false,
    database: '',
    host: '',
    port: 0,
    project_id: 0,
    project_ref: ref ?? '',
    status: 'not_configured',
    updated_at: new Date().toISOString(),
    user: '',
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).put(handlePut)
})

export default apiHandler
