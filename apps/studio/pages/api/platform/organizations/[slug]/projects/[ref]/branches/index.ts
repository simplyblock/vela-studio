import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { mapBranch } from '../../../../../../../../data/vela/api-mappers'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)

  const { data, success } = await client.postOrFail(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
        },
        query: {
          response: 'full',
        },
      },
      body: req.body,
    }
  )

  if (!success) return

  return res.json(data)
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')

  const client = getVelaClient(req)
  const response = await client.get(
    '/organizations/{organization_id}/projects/{project_id}/branches/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
        },
      },
    }
  )

  if (maybeHandleError(res, response, validStatusCodes(200, 404))) return
  if (response.response.status === 404) return res.json([])

  return res.json((response.data ?? []).map(mapBranch))
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handleCreate))

export default apiHandler
