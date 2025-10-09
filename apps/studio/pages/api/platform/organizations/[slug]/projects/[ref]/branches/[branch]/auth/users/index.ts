import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, "slug")

  const client = getVelaClient(req)
  return client.proxyGet(res, '/organizations/{organization_id}/members/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
