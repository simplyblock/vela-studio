import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getVelaClient } from 'data/vela/vela'
import { getKeycloakManager, User } from 'common/keycloak'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const keycloakManager = getKeycloakManager()
    const session = await keycloakManager.getSession(req, res)
    if (!session || !session.user) {
      return res.status(401).json({
        error: 'Unauthorized',
      })
    }

    const user = session.user as User
    const client = getVelaClient(req)
    return client.proxyGet(res, '/users/{user_ref}/roles/', {
      params: {
        path: {
          user_ref: user.id,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
    })
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
