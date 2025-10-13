import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug: organization_id, ref: project_id, branch: branch_id, id } =
    getPlatformQueryParams(req, "slug", "ref", "branch", "id")

  const client = getVelaClient(req)

  const { success, data: credentials } = await client.getOrFail(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users/{user-id}/credentials', {
    params: {
      path: {
        organization_id,
        project_id,
        branch_id,
        'user-id': id
      },
    },
  })
  if (!success) { return }

  for (const credential of credentials.filter(cred => cred.type === 'otp')) {
    const { success } = await client.deleteOrFail(res, '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/auth/users/{user-id}/credentials/{credentialId}', {
      params: {
        path: {
          organization_id,
          project_id,
          branch_id,
          'user-id': id,
          credentialId: credential.id!
        },
      },
    })
    if (!success) { return }
  }

  return res.status(200).json({})
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
