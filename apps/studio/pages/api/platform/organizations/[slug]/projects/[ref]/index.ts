import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_id}/projects/{project_id}/', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
      },
    },
  })

  if (response.response.status !== 200 || response.data === undefined) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(response.data)
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)
  return client.proxyDelete(res, '/organizations/{organization_id}/projects/{project_id}/', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
      },
    },
  })
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = getPlatformQueryParams(req, 'slug', 'ref')
  const client = getVelaClient(req)
  return client.proxyPut(res, '/organizations/{organization_id}/projects/{project_id}/', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
      },
    },
    body: req.body,
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).delete(handleDelete).patch(handlePatch)
)

export default apiHandler
