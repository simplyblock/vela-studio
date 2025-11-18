import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleDelete = (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, id } = getPlatformQueryParams(req, 'slug', 'id')
  const client = getVelaClient(req)
  return client.proxyDelete(res, '/organizations/{organization_id}/members/{user_id}', {
    params: {
      path: {
        organization_id: slug,
        user_id: id,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
