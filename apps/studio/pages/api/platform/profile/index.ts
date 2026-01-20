import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { DEFAULT_PROJECT, DEFAULT_PROJECT_2 } from '../../constants'
import { components } from 'api-types/types/platform'
import { getKeycloakManager } from 'common/keycloak'

type ProfileResponse = components['schemas']['ProfileResponse']

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getKeycloakManager().getSession(req, res)

  if (!session) return res.status(401).json({ message: 'Unauthorized' } )

  // Platform specific endpoint
  const response: ProfileResponse = {
    id: session.user.id,
    primary_email: session.user.email!,
    first_name: session.user.user_metadata?.given_name!,
    last_name: session.user.user_metadata?.family_name!,
    disabled_features: ['realtime:all', ],
    mobile: '',
  }
  return res.status(200).json(response)
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
    ...req.body,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    id: '',
    primary_email: '',
    username: '',
    first_name: '',
    last_name: '',
    organizations: [],
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
})

export default apiHandler
