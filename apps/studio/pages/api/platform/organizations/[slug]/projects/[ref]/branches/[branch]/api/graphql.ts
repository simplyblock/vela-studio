import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getBranchOrRefresh } from 'lib/api/branchCaching'
import { joinPath } from 'lib/api/apiHelpers'
import { apiBuilder } from 'lib/api/apiBuilder'
import { isDocker } from 'lib/docker'

const isInDocker = isDocker()

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const authorizationHeader = req.headers['x-graphql-authorization']
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const branchEntity = await getBranchOrRefresh(slug, ref, branch, req, res)

  if (!branchEntity) {
    return res.status(404).json({ error: 'Branch not found' })
  }

  const graphqlEndpoint = !isInDocker
    ? joinPath(branchEntity.database.service_endpoint_uri, '/graphql')
    : 'http://rest:3000/rpc/graphql'

  const response = await fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      apikey: branchEntity.api_keys.service_role!,
      /*Authorization:
        (Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader) ??
        `Bearer ${branchEntity.api_keys.service_role!}`,*/
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  })
  if (response.ok) {
    const data = await response.json()

    return res.status(200).json(data)
  }
  console.log(response)
  return res.status(500).json({ error: { message: await response.text() } })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handleGet))

export default apiHandler
