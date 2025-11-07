import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)
  return client.proxyPost(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/reset-password', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      }
    },
    body: {
      new_password: req.body.password,
    }
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().patch(handlePatch))

export default apiHandler
