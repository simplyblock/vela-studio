import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)
  return client.proxyGet(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/pgbouncer-config',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
    }
  )
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)
  return client.proxyPatch(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/pgbouncer-config',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
      body: req.body,
    }
  )
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).patch(handlePatch)
})

export default apiHandler
