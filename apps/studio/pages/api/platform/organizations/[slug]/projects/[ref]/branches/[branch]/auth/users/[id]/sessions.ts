import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch, id } = getPlatformQueryParams(req, "slug", "ref", "branch", "id")
  const client = getVelaClient(req)
  return client.proxyGet(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users/{user-id}/sessions', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        'user-id': id
      }
    }
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
