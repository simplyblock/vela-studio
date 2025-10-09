import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return client.proxyGet(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/identity-provider/instances', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      },
    },
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
