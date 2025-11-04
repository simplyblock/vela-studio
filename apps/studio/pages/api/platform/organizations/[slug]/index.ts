import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { mapOrganization } from 'data/vela/api-mappers'
import { VelaType } from 'api-types/types/platform'

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

  const payload = req.body as Omit<VelaType<'OrganizationUpdate'>, 'environments'> & {
    env_types: string[]
  }

  const createResponse = await client.put('/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
    body: {
      name: payload.name,
      max_backups: payload.max_backups,
      environments: payload.env_types
        ? payload.env_types.length === 0
          ? ''
          : payload.env_types.join(',')
        : undefined,
    },
  })

  if (createResponse.response.status !== 201) {
    return res.status(createResponse.response.status).send(createResponse.error)
  }
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)

  return await client.proxyDelete(res, '/organizations/{organization_id}/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).patch(handleUpdate).delete(handleDelete)
)

export default apiHandler
