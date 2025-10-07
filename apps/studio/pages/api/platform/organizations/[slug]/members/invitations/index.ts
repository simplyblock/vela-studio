import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import {
  getVelaClient,
  maybeHandleError,
  validStatusCodes,
} from '../../../../../../../data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')
  const client = getVelaClient(req)

  const result = await client.getOrFail(res, '/organizations/{organization_id}/members/', {
    params: {
      path: {
        organization_id: slug,
      },
    },
  })

  // Request failed, error already handled by getOrFail
  if (!result.success) return

  const userIds = result.data.map((member) => (typeof member === 'string' ? member : member.id))

  const responses = await Promise.all(
    userIds.map((userId) =>
      client.getOrFail(res, '/users/{user_ref}/', {
        params: {
          path: {
            user_ref: userId,
          },
        },
      })
    )
  )

  // Is at least one request failed?
  if (responses.some((response) => !response.success)) return

  const invitations = responses
    .map((response) => response.data)
    .filter((user) => !user?.email_verified)

  return res.status(200).json({ invitations: invitations })
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
