import { NextApiRequest, NextApiResponse } from 'next'
import { getKeycloakManager } from 'common/keycloak'
import { apiBuilder } from 'lib/api/apiBuilder'

const logoutEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_LOGOUT_ENDPOINT
if (!logoutEndpoint) {
  throw new Error('VELA_PLATFORM_KEYCLOAK_LOGOUT_ENDPOINT is not set')
}

const keycloakManager = getKeycloakManager()

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await keycloakManager.getSession(req,res)
  if (!session) {
    return res.json({ error: "No session found"})
  }

  const idToken = session.id_token
  if (!idToken) {
    return res.json({ error: "No id_token found in session"})
  }
  const url = new URL(logoutEndpoint)
  url.searchParams.set("id_token_hint", session.id_token);
  return res.json({ logoutEndpoint: url.toString() })
}

const apiHandler = apiBuilder(builder => builder.post(handlePost))

export default apiHandler
