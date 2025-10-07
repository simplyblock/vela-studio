import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { mapOrganization } from 'data/vela/api-mappers'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)
  const response = await client.get('/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  if (response.response.status !== 200 || response.data === undefined) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(mapOrganization(response.data))
}

const handleUpdate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)
  const createResponse = await client.put('/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
    body: {},
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)

  client.delete("/organizations/{organization_id}/", {
    params: {
      path: {
        organization_id: slug
      }
    }
  })

  return res.status(200).json({
    id: '',
    slug: String(slug),
    name: '',
    deleted_at: '',
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).patch(handleUpdate).delete(handleDelete)
)

export default apiHandler
