import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)
  return client.proxyGet(res, '/resources/organizations/{organization_id}/limits/provisioning', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)
  return client.proxyPost(res, '/resources/organizations/{organization_id}/limits/provisioning', {
    params: {
      path: {
        organization_id: slug,
      },
    },
    body: req.body,
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
