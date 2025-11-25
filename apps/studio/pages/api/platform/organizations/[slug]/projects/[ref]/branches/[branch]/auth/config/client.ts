import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { components } from 'data/vela/vela-schema'

type KeycloakClient = components['schemas']['ClientRepresentation']

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)
  const { success, data } = await client.getOrFail(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/clients', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch
      }
    }
  })

  if (!success) return

  const realmClient = data.find((client: any) => client.clientId === 'application-client')
  if (!realmClient) {
    return res.status(404).json({ message: 'Missing client in branch realm' })
  }
  return res.json(realmClient)
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, "slug", "ref", "branch")
  const client = getVelaClient(req)

  const body = req.body as KeycloakClient
  const id = body.id
  if (!id) return res.status(422).json({ message: 'Missing id' })

  return client.proxyPut(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/clients/{client-uuid}', {
    params: {
      path: {
        organization_id: slug,
        project_id: ref,
        branch_id: branch,
        'client-uuid': id
      }
    }
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet).put(handlePut))

export default apiHandler
