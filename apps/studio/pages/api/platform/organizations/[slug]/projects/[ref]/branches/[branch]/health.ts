import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { components } from 'data/vela/vela-schema'

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

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const serviceList = req.query.services
  if (!serviceList) {
    return res.status(200).json([])
  }

  const client = getVelaClient(req)
  const { data, success } = await client.getOrFail(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/status',
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

  if (!success) {
    return res.status(500).json({ error: 'Failed to fetch branch status' })
  }

  const branchStatus = (data as components['schemas']['BranchStatusPublic']).service_status

  const services =
    typeof serviceList === 'string' ? serviceList.split(',') : (serviceList as string[])

  const response: Response = services
    .map((service) => {
      if (service === 'db') {
        return {
          healthy: branchStatus.database === 'ACTIVE_HEALTHY',
          name: service as any,
          status:
            branchStatus.database === 'ACTIVE_HEALTHY'
              ? 'ACTIVE_HEALTHY'
              : branchStatus.database === 'STARTING' ||
                  branchStatus.database === 'CREATING' ||
                  branchStatus.database === 'RESUMING' ||
                  branchStatus.database === 'RESTARTING'
                ? 'COMING_UP'
                : 'UNHEALTHY',
        } as V1ServiceHealthResponse
      } else if (service === 'rest') {
        return {
          healthy: branchStatus.rest === 'ACTIVE_HEALTHY',
          name: service as any,
          status:
            branchStatus.rest === 'ACTIVE_HEALTHY'
              ? 'ACTIVE_HEALTHY'
              : branchStatus.rest === 'STARTING' ||
                  branchStatus.rest === 'CREATING' ||
                  branchStatus.rest === 'RESUMING' ||
                  branchStatus.rest === 'RESTARTING'
                ? 'COMING_UP'
                : 'UNHEALTHY',
        } as V1ServiceHealthResponse
      } else if (service === 'storage') {
        return {
          healthy: branchStatus.storage === 'ACTIVE_HEALTHY',
          name: service as any,
          status:
            branchStatus.storage === 'ACTIVE_HEALTHY'
              ? 'ACTIVE_HEALTHY'
              : branchStatus.storage === 'STARTING' ||
                  branchStatus.storage === 'CREATING' ||
                  branchStatus.storage === 'RESUMING' ||
                  branchStatus.storage === 'RESTARTING'
                ? 'COMING_UP'
                : 'UNHEALTHY',
        } as V1ServiceHealthResponse
      }
      return undefined
    })
    .filter((item) => !!item)

  return res.status(200).json(response)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
