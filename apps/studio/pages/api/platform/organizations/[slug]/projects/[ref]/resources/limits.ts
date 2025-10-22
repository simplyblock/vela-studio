import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')
  const client = getVelaClient(req)
  return client.proxyGet(res, '/resources/projects/{project_id}/limits/provisioning', {
    params: {
      path: {
        project_id: ref,
      },
    },
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')
  const client = getVelaClient(req)
  return client.proxyPost(res, '/resources/projects/{project_id}/limits/provisioning', {
    params: {
      path: {
        project_id: ref,
      },
    },
    body: req.body,
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
