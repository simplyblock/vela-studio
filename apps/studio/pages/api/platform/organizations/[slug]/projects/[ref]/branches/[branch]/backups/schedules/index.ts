import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { components } from 'data/vela/vela-schema'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const response = await client.get('/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
    },
  })

  if (maybeHandleError(res, response, validStatusCodes(200, 404))) return
  if (response.response.status === 404) return res.json([])
  return res.json(response.data || [])
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return await client.proxyPost(res, '/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
      query: {
        response: "full"
      }
    },
    body: req.body,
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return await client.proxyPut(res, '/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
      query: {
        response: "full"
      }
    },
    body: req.body,
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
)

export default apiHandler
