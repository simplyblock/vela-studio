import { apiBuilder } from '../../../../../../../lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

// FIXME: Implementation missing
interface V1ServiceHealthResponse {
  error?: string
  healthy: boolean
  info?:
    | {
        description: string
        /** @enum {string} */
        name: 'GoTrue'
        version: string
      }
    | {
        connected_cluster: number
        db_connected: boolean
        healthy: boolean
      }
  /** @enum {string} */
  name:
    | 'auth'
    | 'db'
    | 'db_postgres_user'
    | 'pooler'
    | 'realtime'
    | 'rest'
    | 'storage'
    | 'pg_bouncer'
  /** @enum {string} */
  status: 'COMING_UP' | 'ACTIVE_HEALTHY' | 'UNHEALTHY'
}

type Response = V1ServiceHealthResponse[]

const handleGet = (req: NextApiRequest, res: NextApiResponse) => {
  const serviceList = req.query.services
  if (!serviceList) {
    return res.status(200).json([])
  }

  const services =
    typeof serviceList === 'string' ? serviceList.split(',') : (serviceList as string[])
  const response: Response = services.map((service) => {
    return {
      healthy: true,
      name: service as any,
      status: 'ACTIVE_HEALTHY',
    }
  })

  return res.status(200).json(response)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
