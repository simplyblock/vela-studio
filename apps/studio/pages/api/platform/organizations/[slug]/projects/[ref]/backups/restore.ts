import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)
  return client.proxyPost(res, '/organizations/{organization_id}/projects/{project_id}/branches/', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
      },
    },
    body: req.body,
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
