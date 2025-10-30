import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getBranchOrRefresh } from 'lib/api/branchCaching'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const branchEntity = await getBranchOrRefresh(slug, ref, branch, async () => {
    const client = getVelaClient(req)
    const response = await client.get(
      '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/',
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
    if (maybeHandleError(res, response)) return
    return response.data!
  })

  if (!branchEntity) {
    return res.status(404).json({
      error: 'Branch not found',
    })
  }

  return res.status(200).json({ api_key: branchEntity.api_keys.service_role })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
