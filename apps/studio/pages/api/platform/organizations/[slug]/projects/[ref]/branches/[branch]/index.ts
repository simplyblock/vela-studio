import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { Branch } from 'data/branches/branch-query'

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)

  return await client.proxyPut(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
      body: {
        name: req.body,
      },
    }
  )
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')
  const client = getVelaClient(req)
  return await client.proxyDelete(
    res,
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
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse<Branch>) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return await client.proxyGet(
    res,
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
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).put(handlePut).delete(handleDelete)
)

export default apiHandler
