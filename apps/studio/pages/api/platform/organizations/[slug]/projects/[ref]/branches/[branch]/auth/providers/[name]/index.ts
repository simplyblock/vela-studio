import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch, name } = getPlatformQueryParams(req, "slug", "ref", "branch", "name")
  const client = getVelaClient(req)
  return client.proxyDelete(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/oauth/{oauth_name}/', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        oauth_name: name,
      }
    }
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().delete(handleDelete))

export default apiHandler
