import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient, maybeHandleError } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { mapOrganizationMember } from 'data/vela/api-mappers'
import { Member } from 'data/organizations/organization-members-query'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_id}/members/', {
    params: {
      path: {
        organization_id: slug,
      },
      query: {
        response: 'deep',
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  const members: Member[] = []
  for (const member of response.data) {
    if (typeof member === 'string') continue
    const rolesResponse = await client.get(
      '/organizations/{organization_id}/roles/role-assignments/',
      {
        params: {
          path: {
            organization_id: slug,
          },
          query: {
            user_id: member.id,
          },
        },
      }
    )

    if (maybeHandleError(res, rolesResponse)) {
      return
    }

    const roles = rolesResponse.data?.map((role) => role.role_id) ?? []
    members.push(mapOrganizationMember(member, roles))
  }

  return res.status(200).json(members)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
