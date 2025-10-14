import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    slug: organization_id,
    ref: project_id,
    branch: branch_id,
  } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return client.proxyGet(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users',
    {
      params: {
        path: {
          organization_id,
          project_id,
          branch_id,
        },
      },
    }
  )
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const {
    slug: organization_id,
    ref: project_id,
    branch: branch_id,
  } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return client.proxyPost(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users',
    {
      params: {
        path: {
          organization_id,
          project_id,
          branch_id,
        },
      },
      body: {
        username: req.body.email,
        email: req.body.email,
        enabled: true,
        emailVerified: req.body.email_confirm,
        credentials: [
          {
            type: 'password',
            value: req.body.password,
            temporary: req.body.force_password_update,
          },
        ],
      },
    }
  )
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
