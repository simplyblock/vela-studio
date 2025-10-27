import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const response = await client.get('/backup/organizations/{organization_id}/schedule', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  if (maybeHandleError(res, response, validStatusCodes(200, 404))) return
  if (response.response.status === 404) return res.json([])
  return res.json(response.data || [])
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  return await client.proxyPost(
    res,
    '/backup/organizations/{organization_id}/schedule',
    {
      params: {
        path: {
          organization_id: slug,
        },
        query: {
          response: "full"
        }
      },
      body: req.body,
    }
  )
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  return await client.proxyPut(
    res,
    '/backup/organizations/{organization_id}/schedule',
    {
      params: {
        path: {
          organization_id: slug,
        },
        query: {
          response: "full"
        }
      },
      body: req.body,
    }
  )
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
)

export default apiHandler
