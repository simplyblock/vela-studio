import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = getVelaClient(req)
  const { slug } = getPlatformQueryParams(req, 'slug')
  const response = await client.post('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: slug,
      },
      query: {
        response: "full"
      }
    },
    body: req.body
  })
//        database_image_tag: '15.1.0.147',
  if (response.response.status !== 201) {
    return res
      .status(response.response.status)
      .send({ message: response.error?.detail ?? 'Unknown error' })
  }

  if (maybeHandleError(res, response)) {
    return
  }

  return res.status(200).json(response.data)
}

const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_id}/projects/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGetAll).post(handleCreate))

export default apiHandler
