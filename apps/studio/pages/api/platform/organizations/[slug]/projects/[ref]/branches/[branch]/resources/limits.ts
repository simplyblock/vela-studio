import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { branch } = getPlatformQueryParams(req, 'branch')
  const client = getVelaClient(req)
  return client.proxyGet(res, '/resources/branches/{branch_id}/limits/', {
    params: {
      path: {
        branch_id: branch,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
