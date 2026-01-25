import KeycloakProvider, { KeycloakProfile } from 'next-auth/providers/keycloak'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import NextAuth, {
  Account,
  AuthOptions,
  getServerSession,
  Profile,
  Session as AuthSession,
} from 'next-auth'
import { JWT } from 'next-auth/jwt'
import { OAuthUserConfig } from 'next-auth/providers/oauth'

export const DEFAULT_FALLBACK_PATH = '/org'

export interface KeycloakConfig {
  secret: string
  issuer: string
  clientId: string
  clientSecret: string
  authorizationEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
  logoutEndpoint: string
  jwksEndpoint: string
}

export interface Factor {
  id: string
  friendly_name?: string
  factor_type: 'totp' | 'phone' | (string & {})
  status: 'verified' | 'unverified'
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email?: string
  factors: Factor[]
  user_metadata?: {
    avatar_url?: string
    full_name?: string
    given_name?: string
    family_name?: string
    email_verified?: boolean
  }
}

export interface BaseAuthToken extends JWT {
  access_token: string
  refresh_token: string
  id_token: string
  token_type: string
  expires_at: number
  expires_in: number
  error?: string
}

export interface AuthToken extends BaseAuthToken {
  user: User
}

export interface Session extends AuthSession {
  access_token: string
  refresh_token: string
  id_token: string
  token_type: string
  expires_at: number
  expires_in: number
  user: User
}

export interface KeycloakManager {
  asNextAuthHandler(): NextApiHandler
  getSession(req: NextApiRequest, res: NextApiResponse): Promise<Session | null>
}

class ServerKeycloakManager implements KeycloakManager {
  readonly #config: KeycloakConfig
  readonly #authOptions: AuthOptions
  readonly #nextAuthHandler: NextApiHandler

  constructor(config: KeycloakConfig) {
    this.#config = config
    this.#authOptions = this.#buildAuthOptions()
    this.#nextAuthHandler = this.#buildNextAuthHandler()
  }

  async getSession(req: NextApiRequest, res: NextApiResponse): Promise<Session | null> {
    const session = await getServerSession(req, res, this.#authOptions)
    return session as Session | null
  }

  asNextAuthHandler(): NextApiHandler {
    return (req: NextApiRequest, res: NextApiResponse) => {
      try {
        return this.#nextAuthHandler(req, res)
      } catch (err) {
        console.error('Error handling request', err)
        res.status(500).json({ error: 'Internal Server Error' })
      }
    }
  }

  #extractTokenExpiry(token: JWT, account: Account | null): number | undefined {
    let expiresAt: number | undefined = undefined
    if (account && account.expires_at) {
      expiresAt = account.expires_at
    } else if (typeof token.expires_at === 'number') {
      expiresAt = token.expires_at as number
    }
    return expiresAt
  }

  #extractRefreshToken(token: JWT, account: Account | null): string | undefined {
    if (typeof token.refresh_token === 'string') return token.refresh_token as string
    if (account && account.refresh_token) return account.refresh_token
    return undefined
  }

  #extractTokenType(token: JWT, account: Account | null): string {
    if (account && account.token_type) return account.token_type
    if (typeof token.token_type === 'string') return token.token_type as string
    return 'Bearer'
  }

  #expiresIn(expiresAt: number): { expires_in: number } {
    return Object.defineProperty({}, 'expires_in', {
      get: () => {
        return Math.floor(expiresAt - Date.now() / 1000)
      },
      enumerable: true,
    }) as any
  }

  async #maybeRefreshToken(token: JWT, account: Account | null): Promise<BaseAuthToken> {
    const expiresAt = this.#extractTokenExpiry(token, account)
    if (expiresAt && Date.now() / 1000 > expiresAt - 30) {
      // Token will expire in less than 30 seconds, we'll refresh it now
      return await this.#refreshToken(token, account)
    }

    if (!account) {
      // Account is only set if this is a login. Otherwise, it'll have the previously created token.
      return token as any
    }

    const newExpiresAt = account.expires_at || 0
    return {
      ...token,
      ...this.#expiresIn(newExpiresAt),
      access_token: account.access_token!,
      refresh_token: account.refresh_token!,
      expires_at: account.expires_at || 0,
      token_type: this.#extractTokenType(token, account),
      id_token: account.id_token!,
    }
  }

  async #refreshToken(token: JWT, account: Account | null): Promise<BaseAuthToken> {
    console.log(`Refreshing access token for: ${token.sub ?? 'unknown'}`)
    const refreshToken = this.#extractRefreshToken(token, account)
    if (!refreshToken) {
      throw new Error('No refresh token found')
    }

    try {
      const tokenEndpoint = this.#config.tokenEndpoint
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: this.#config.clientId,
          client_secret: this.#config.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })

      const tokensOrError = await response.json()
      if (!response.ok) throw tokensOrError

      console.log(`Successfully refreshed access token for: ${token.sub ?? 'unknown'}`)
      const newToken = tokensOrError as {
        access_token: string
        id_token: string
        expires_in: number
        refresh_token?: string
      }

      const expiresAt = Math.floor(Date.now() / 1000 + newToken.expires_in)
      return {
        ...token,
        ...this.#expiresIn(expiresAt),
        token_type: 'bearer',
        access_token: newToken.access_token,
        expires_at: expiresAt,
        refresh_token: newToken.refresh_token ? newToken.refresh_token : refreshToken,
        id_token: newToken.id_token,
      }
    } catch (err) {
      console.error('Error refreshing access_token', err)
      // If we fail to refresh the token, return an error so we can handle it on the page
      token.error = 'RefreshTokenError'
      return token as BaseAuthToken
    }
  }

  async #signOut(session: AuthSession, token: JWT): Promise<void> {}

  async #adjustJwt(
    token: JWT,
    account: Account | null,
    profile?: Profile,
    trigger?: 'signIn' | 'signUp' | 'update'
  ): Promise<JWT> {
    const baseToken = await this.#maybeRefreshToken(token, account)
    if (baseToken.error) {
      throw new Error(baseToken.error)
    }

    if (baseToken.user) {
      return {
        ...(baseToken as AuthToken),
      }
    }

    const freeProfile = profile as KeycloakProfile & { amr: string[] }
    return {
      ...baseToken,
      user: {
        id: freeProfile.sub,
        email: freeProfile.email,
        factors: trigger === 'signIn' ? freeProfile.amr ?? [] : baseToken.factors ?? [],
        user_metadata: {
          full_name: freeProfile.name,
          preferred_username: freeProfile.preferred_username,
          given_name: freeProfile.given_name,
          family_name: freeProfile.family_name,
          email_verified: freeProfile.email_verified,
        },
      },
    }
  }

  async #adjustSession(session: AuthSession, token: JWT): Promise<Session> {
    const authToken = token as AuthToken
    return {
      ...session,
      ...this.#expiresIn(authToken.expires_at),
      access_token: authToken.access_token,
      refresh_token: authToken.refresh_token,
      token_type: authToken.token_type,
      expires_at: authToken.expires_at,
      user: authToken.user,
      id_token: authToken.id_token,
    }
  }

  #buildAuthOptions(): AuthOptions {
    return {
      secret: this.#config.secret,
      debug: false,
      events: {
        signOut: ({ session, token }) => {
          return this.#signOut(session, token)
        },
      },
      callbacks: {
        jwt: ({ token, account, profile, trigger }) => {
          return this.#adjustJwt(token, account, profile, trigger)
        },
        session: ({ session, token }) => {
          return this.#adjustSession(session, token)
        },
      },
      providers: [KeycloakProvider(this.#buildProviderConfig())],
    }
  }

  #buildProviderConfig(): OAuthUserConfig<KeycloakProfile> {
    return {
      issuer: this.#config.issuer,
      clientId: this.#config.clientId,
      clientSecret: this.#config.clientSecret,
      authorization: this.#config.authorizationEndpoint,
      token: this.#config.tokenEndpoint,
      userinfo: this.#config.userInfoEndpoint,
      jwks_endpoint: this.#config.jwksEndpoint,
      wellKnown: undefined,
    }
  }

  #buildNextAuthHandler(): NextApiHandler {
    return NextAuth(this.#authOptions)
  }
}

const newServerKeycloakManager = (): KeycloakManager => {
  const issuer = process.env.VELA_PLATFORM_KEYCLOAK_ISSUER
  if (!issuer) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_ISSUER is not set')
  }
  const clientId = process.env.VELA_PLATFORM_KEYCLOAK_CLIENT_ID
  if (!clientId) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_CLIENT_ID is not set')
  }
  const clientSecret = process.env.VELA_PLATFORM_KEYCLOAK_CLIENT_SECRET
  if (!clientSecret) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_CLIENT_SECRET is not set')
  }
  const authorizationEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_AUTHORIZATION_ENDPOINT
  if (!authorizationEndpoint) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_AUTHORIZATION_ENDPOINT is not set')
  }
  const tokenEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_TOKEN_ENDPOINT
  if (!tokenEndpoint) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_TOKEN_ENDPOINT is not set')
  }
  const userInfoEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_USERINFO_ENDPOINT
  if (!userInfoEndpoint) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_USERINFO_ENDPOINT is not set')
  }
  const logoutEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_LOGOUT_ENDPOINT
  if (!logoutEndpoint) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_LOGOUT_ENDPOINT is not set')
  }
  const jwksEndpoint = process.env.VELA_PLATFORM_KEYCLOAK_JWKS_ENDPOINT
  if (!jwksEndpoint) {
    throw new Error('VELA_PLATFORM_KEYCLOAK_JWKS_ENDPOINT is not set')
  }
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not set')
  }
  const authUrl = process.env.NEXTAUTH_URL
  if (!authUrl) {
    throw new Error('NEXTAUTH_URL is not set')
  }
  return new ServerKeycloakManager({
    secret,
    issuer,
    clientId,
    clientSecret,
    authorizationEndpoint,
    tokenEndpoint,
    userInfoEndpoint,
    logoutEndpoint,
    jwksEndpoint,
  })
}

const newKeycloakManager = () => {
  if (typeof window !== 'undefined') {
    // KeycloakManager cannot be used in the browser
    return undefined as any
  }
  return newServerKeycloakManager()
}

const keycloakManager: KeycloakManager = newKeycloakManager()
export function getKeycloakManager(): KeycloakManager {
  return keycloakManager
}

export function validateReturnTo(
  returnTo: string,
  fallback: string = DEFAULT_FALLBACK_PATH
): string {
  // Block protocol-relative URLs and external URLs
  if (returnTo.startsWith('//') || returnTo.includes('://')) {
    return fallback
  }

  // For internal paths:
  // 1. Must start with /
  // 2. Only allow alphanumeric chars, slashes, hyphens, underscores
  // 3. For query params, also allow =, &, and ?
  const safePathPattern = /^\/[a-zA-Z0-9/\-_]*(?:\?[a-zA-Z0-9\-_=&]*)?$/
  return safePathPattern.test(returnTo) ? returnTo : fallback
}

export function getReturnToPath(fallback = DEFAULT_FALLBACK_PATH): string {
  // If we're in a server environment, return the fallback
  if (typeof location === 'undefined') {
    return fallback
  }

  const searchParams = new URLSearchParams(location.search)

  let returnTo = searchParams.get('returnTo') ?? fallback

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()
  const validReturnTo = validateReturnTo(returnTo, fallback)

  const [path, existingQuery] = validReturnTo.split('?')

  const finalSearchParams = new URLSearchParams(existingQuery || '')

  // Add all remaining search params to the final search params
  if (remainingSearchParams) {
    const remainingParams = new URLSearchParams(remainingSearchParams)
    remainingParams.forEach((value, key) => {
      finalSearchParams.append(key, value)
    })
  }

  const finalQuery = finalSearchParams.toString()
  return path + (finalQuery ? `?${finalQuery}` : '')
}
