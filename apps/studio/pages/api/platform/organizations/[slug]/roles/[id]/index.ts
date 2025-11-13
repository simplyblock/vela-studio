import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id } = getPlatformQueryParams(req, 'slug', 'id')
  const client = getVelaClient(req)
  return client.proxyPut(res, '/organizations/{organization_id}/roles/{role_id}/', {
    params: {
      path: {
        organization_id: slug,
        role_id: id,
      },
    },
    body: req.body
  })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id } = getPlatformQueryParams(req, 'slug', 'id')
  const client = getVelaClient(req)
  return client.proxyDelete(res, '/organizations/{organization_id}/roles/{role_id}/', {
    params: {
      path: {
        organization_id: slug,
        role_id: id,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().put(handlePut).delete(handleDelete))

export default apiHandler
