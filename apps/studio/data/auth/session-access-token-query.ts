import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { authKeys } from './keys'
import { getSession } from 'next-auth/react'
import { isExpired } from 'common'
import { Session } from 'common/keycloak'

export async function getSessionAccessToken() {
  // ignore if server-side
  if (typeof window === 'undefined') return ''

  try {
    const session = await getSession()
    const extendedSession = session as Session | null
    const aboutToExpire = isExpired(extendedSession?.expires_in ?? 0)
    if (aboutToExpire) {
      return undefined
    }
    return extendedSession?.access_token
  } catch (e: any) {
    // ignore the error
    return null
  }
}

export type SessionAccessTokenData = Awaited<ReturnType<typeof getSessionAccessToken>>
export type SessionAccessTokenError = unknown

export const useSessionAccessTokenQuery = <TData = SessionAccessTokenData>({
  enabled = true,
  ...options
}: UseQueryOptions<SessionAccessTokenData, SessionAccessTokenError, TData> = {}) =>
  useQuery<SessionAccessTokenData, SessionAccessTokenError, TData>(
    authKeys.accessToken(),
    () => getSessionAccessToken(),
    options
  )
