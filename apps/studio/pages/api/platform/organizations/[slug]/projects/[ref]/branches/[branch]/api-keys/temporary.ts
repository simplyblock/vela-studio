import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getBranchOrRefresh } from 'lib/api/branchCaching'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const branchEntity = await getBranchOrRefresh(slug, ref, branch, req, res)

  if (!branchEntity) {
    return res.status(404).json({
      error: 'Branch not found',
    })
  }

  return res.status(200).json({ api_key: branchEntity.api_keys.service_role })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
