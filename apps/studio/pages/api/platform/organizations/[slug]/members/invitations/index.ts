import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { mapOrganizationMember } from 'data/vela/api-mappers'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const response = await client.get('/organizations/{organization_id}/members/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  if (response.response.status !== 200 || !response.data) {
    return res.status(response.response.status).send(response.error)
  }

  return res.status(200).json(
    response.data
      .filter((item) => typeof item !== 'string')
      .filter((item) => !item.email_verified)
      .map(mapOrganizationMember)
  )
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  // Find existing user by email
  const findUserResponse = await client.get('/users/{user_ref}/', {
    params: {
      path: req.body.email,
    },
  })

  if (maybeHandleError(res, findUserResponse, validStatusCodes(200, 404))) return

  const existingUser = findUserResponse.data
  let userId = existingUser?.id

  if (!userId) {
    // Create a new user if not found
    const result = await client.postOrFail(res, '/users/', {
      body: {
        email: req.body.email,
        first_name: req.body.first_name,
        last_name: req.body.last_name,
      },
    })

    // Error already handled by postOrFail
    if (!result.success) return

    // Store new user id
    userId = result.data[0].id
  }

  // Add user to an organization
  return client.proxyPost(res, '/organizations/{organization_id}/members/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
    body: {
      id: userId,
    },
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
