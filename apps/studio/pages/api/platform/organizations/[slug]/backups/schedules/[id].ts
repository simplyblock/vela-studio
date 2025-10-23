import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')

  const client = getVelaClient(req)
  return client.proxyDelete(res, '/backup/schedule/{schedule_id}/', {
    params: {
      path: {
        schedule_id: id,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
