import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { Branch } from 'api-types/types'
import { getVelaClient } from 'data/vela/vela'
import { mapProjectBranch } from 'data/vela/api-mappers'

const handleCreate = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)

  const { data, success } = await client.postOrFail(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
        },
        query: {
          response: 'full'
        }
      },
      body: {
        name: req.body.branch_name,
        source: req.body.source,
      },
    }
  )

  if (!success) return

  return res.json(mapProjectBranch(data!, slug, ref))
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse<Branch[]>) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')

  const client = getVelaClient(req)
  const { data, success } = await client.getOrFail(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
        },
      },
    }
  )

  if (!success) return

  return res.json(data?.map((branch) => mapProjectBranch(branch, slug, ref)) ?? [])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handleCreate))

export default apiHandler
