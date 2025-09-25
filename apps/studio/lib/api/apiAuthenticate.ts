import type { NextApiRequest, NextApiResponse } from 'next'
import type { SupaResponse, User } from 'types'
import * as jose from 'jose'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../pages/api/auth/[...nextauth]'

const authClient = (function () {
  const issuer = process.env.VELA_PLATFORM_KEYCLOAK_ISSUER
  if (!issuer) {
    throw new Error('Missing VELA_PLATFORM_KEYCLOAK_ISSUER env var')
  }

  const jwksUrl = `${issuer}/protocol/openid-connect/certs`
  const jwks = jose.createRemoteJWKSet(new URL(jwksUrl))

  const verifyAccessToken = async (
    authorization?: string,
    required?: { anyRole?: string[]; allScopes?: string[] }
  ) => {
    if (!authorization?.startsWith('Bearer')) {
      throw new Response('Missing or invalid Authorization header', { status: 401 })
    }

    const token = authorization?.slice('Bearer '.length).trim()

    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: issuer,
      algorithms: ['RS256'],
    })

    const roles = (payload.realm_access as any)?.roles || []

    const tokenScopes = (payload.scope as string | undefined)?.split(' ') || []
    if (required?.allScopes && required.allScopes.every((scope) => !tokenScopes.includes(scope))) {
      throw new Response('Forbidden (insufficient scope)', { status: 403 })
    }
    if (required?.anyRole && required.anyRole.some((role) => roles.includes(role))) {
      throw new Response('Forbidden (insufficient role)', { status: 403 })
    }

    return {
      sub: payload.sub?.toString(),
      email: payload.email as string | undefined,
      roles,
      raw: payload,
    }
  }

  return {
    verifyAccessToken,
  }
})()

/**
 * Use this method on api routes to check if user is authenticated and having required permissions.
 * This method can only be used from the server side.
 * Member permission is mandatory whenever orgSlug/projectRef query param exists
 * @param {NextApiRequest}    req
 * @param {NextApiResponse}   res
 *
 * @returns {Object<user, error, description>}
 *   user null, with error and description if not authenticated or not enough permissions
 */
export async function apiAuthenticate(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<SupaResponse<User>> {
  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return { error: new Error('The user does not exist') }
    }
    return session.user as User

    /*const accessToken = await authClient.verifyAccessToken(req.headers.authorization, {})
    return {
      id: accessToken.sub as string,
      username: accessToken.raw.preferred_username as string,
      first_name: accessToken.raw.given_name as string,
      last_name: accessToken.raw.family_name as string,
      primary_email: accessToken.email as string,
      mobile: '',
      user_id: accessToken.sub as string,
      is_alpha_user: false,
      free_project_limit: 0,
    } as User*/
  } catch (error) {
    console.log('apiAuthenticate::error', error)
    return { error: error as Error }
  }
}
