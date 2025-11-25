import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getBranchOrRefresh } from 'lib/api/branchCaching'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { isDocker } from 'lib/docker'
import { joinPath } from 'lib/api/apiHelpers'

const isInDocker = isDocker()

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log("TEST POSTGREST")
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const branchEntity = await getBranchOrRefresh(slug, ref, branch, req, res)

  if (!branchEntity) {
    return res.status(404).json({ error: 'Branch not found', })
  }

  const postgrestEndpoint = !isInDocker
    ? joinPath(branchEntity.database.service_endpoint_uri, '/rest/v1/')
    : 'http://rest:3000'

  const response = await fetch(postgrestEndpoint, {
    method: 'GET',
    headers: {
      apikey: branchEntity.api_keys.service_role!,
    },
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }

  return res.status(500).json({ error: { message: 'Internal Server Error' } })
}

const handleHead = async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).end()
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).head(handleHead))

export default apiHandler
