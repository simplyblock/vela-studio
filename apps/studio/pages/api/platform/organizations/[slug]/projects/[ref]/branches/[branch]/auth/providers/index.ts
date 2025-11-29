import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { AuthProviderCreateVariables } from 'data/auth/auth-provider-create-mutation'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  return client.proxyGet(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/identity-provider/instances',
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

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const body = req.body as AuthProviderCreateVariables['create']

  const client = getVelaClient(req)
  return client.proxyPost(
    res,
    '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/identity-provider/instances',
    {
      params: {
        path: {
          organization_id: slug,
          project_id: ref,
          branch_id: branch,
        },
      },
      body: {
        providerId: "oauth2",
        displayName: body.displayName,
        alias: body.alias,
        enabled: true,
        config: {
          authorizationUrl: body.authorizationUrl,
          clientId: body.clientId,
          issuer: body.issuer,
          tokenUrl: body.tokenUrl,
          userInfoUrl: body.userInfoUrl,
        },
      },
    }
  )
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
