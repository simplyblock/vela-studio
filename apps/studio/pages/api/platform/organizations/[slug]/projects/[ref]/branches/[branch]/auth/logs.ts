import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const path_params = ["slug", "ref", "branch"]
  const { slug, ref, branch } = getPlatformQueryParams(req, ...path_params)
  const filter = Object.fromEntries(Object.entries(req.query).filter(([key]) => !path_params.includes(key)))

  const client = getVelaClient(req)
  const { success, data } = await client.getOrFail(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/events', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      },
      query: filter,
    }
  })

  return res.status(200).json(data)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
