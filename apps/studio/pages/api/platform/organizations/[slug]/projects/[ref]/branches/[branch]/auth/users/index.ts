import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug: organization_id, ref: project_id, branch: branch_id } =
    getPlatformQueryParams(req, "slug", "ref", "branch")

  const client = getVelaClient(req)
  return client.proxyGet(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users', {
    params: {
      path: { organization_id, project_id, branch_id },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
