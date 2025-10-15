import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { backup } = getPlatformQueryParams(req, 'backup')

  const client = getVelaClient(req)
  return client.proxyDelete(res, '/backup/{backup_ref}', {
    params: {
      path: {
        backup_ref: backup,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
