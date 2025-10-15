import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'

const path = '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)

  const { success: realm_success, data: realm } = await client.getOrFail(res, path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      }
    }
  })

  if (!realm_success) return;

  return res.status(200).json({
    host: realm.smtpServer.host,
    port: realm.smtpServer.port,
    from: realm.smtpServer.from,
    fromDisplayName: realm.smtpServer.fromDisplayName,
    username: (realm.smtpServer.auth !== undefined) ? realm.smtpServer.user : undefined,
    encrypthon: (realm.smtpServer.starttls) ? 'StartTLS' : (realm.smtpServer.ssl) ? 'ssl' : undefined,
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)

  const path = '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/'
  const { success: realm_success, data: realm } = await client.getOrFail(res, path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      }
    }
  })

  if (!realm_success) return;

  const { success: update_realm_success } = await client.putOrFail(res, path, {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
      }
    },
    body: {
      ...realm,
      smtpServer: {
        host: req.body.host,
        port: req.body.port,
        from: req.body.from,
        fromDisplayName: req.body.fromDisplayName,
        auth: (req.body.username !== undefined) && (req.body.password !== undefined),
        user: req.body.username,
        password: req.body.password,
        starttls: req.body.encryption == 'StartTLS',
        ssl: req.body.encryption == 'SSL',
      }
    },
  })

  if (!update_realm_success) return;
  return res.status(200).json({})
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet).put(handlePut))

export default apiHandler
