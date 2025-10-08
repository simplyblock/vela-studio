import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, user_id, role_id } = getPlatformQueryParams(req, 'slug', 'user_id', 'role_id')
  const client = getVelaClient(req)

  const response = await client.delete(
    '/organizations/{organization_id}/roles/{role_id}/users/{user_id}/',
    {
      params: {
        path: {
          organization_id: slug,
          user_id,
          role_id,
        },
      },
    }
  )

  if (response.error) {
    return res.status(response.response.status).json(response.error)
  }

  return res.status(200).json(response.data)
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().delete(handleDelete)
})

export default apiHandler
