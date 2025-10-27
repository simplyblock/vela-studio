import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const response = await client.get('/backup/branches/{branch_id}/', {
    params: {
      path: {
        branch_id: branch,
      },
    },
  })

  if (maybeHandleError(res, response, validStatusCodes(200, 404))) return
  if (response.response.status === 404) return res.json([])

  return res.json(
    response.data?.map((backup) => {
      return {
        id: backup.id,
        organization_id: slug,
        project_id: ref,
        branch_id: backup.branch_id,
        row_index: backup.row_index,
        created_at: backup.created_at,
      }
    }) || []
  )
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return await client.proxyPost(res, '/backup/branches/{branch_id}/', {
    params: {
      path: {
        branch_id: branch,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
