'use client'

import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearLocalStorage } from './constants'
import { useSession as useAuthSession, signOut as authSignOut, getSession } from 'next-auth/react'
import { Session } from './keycloak'
import { AuthError } from '@supabase/auth-js'

export type AuthState = {
  session: Session | null
  error: AuthError | null
  isLoading: boolean
}
export type AuthContext = {
  refreshSession: () => Promise<Session | null>
} & AuthState

export const AuthContext = createContext<AuthContext>({
  session: null,
  error: null,
  isLoading: true,
  refreshSession: () => Promise.resolve(null),
})

export type AuthProviderProps = {}

export const AuthProvider = ({ children }: PropsWithChildren<AuthProviderProps>) => {
  const { status, data: session } = useAuthSession({
   required: false,
  })

  const [state, setState] = useState<AuthState>({ session: null, error: null, isLoading: true })

  // Helper method to refresh the session.
  // For example, after a user updates their profile
  const refreshSession = useCallback(async () => {
    const session = await getSession()
    const extendedSession = session as Session

    // Force relogin
    const delta = extendedSession ? (extendedSession.expires_at - new Date().getTime() / 1000 - 30) : 0
    if (delta < 0) {
      return null
    }

    setState({
      ...state,
      session: session as Session | null,
      isLoading: status === 'loading',
    })
    return session as Session | null
  }, [status])

  useEffect(() => {
    setState({
      ...state,
      session: session as Session | null,
      isLoading: status === 'loading',
    })
  }, [status])

  useEffect(() => {
    if (location.pathname.endsWith('/sign-in')) {
      return
    }

    let timeout: number | undefined
    if (state && state.session) {
      const expiresAt = state.session.expires_at
      const delta = (expiresAt - new Date().getTime() / 1000 - 30)
      if (delta < 0) {
        console.log('Session expired, refreshing...')
        let pathname = location.pathname
        if (pathname.indexOf('://') !== -1) {
          pathname = pathname.split('://')[1]
        }

        if (pathname === '/sign-in') {
          // If the user is already on the sign in page, we don't need to redirect them
          return
        }

        const searchParams = new URLSearchParams(location.search)
        searchParams.set('returnTo', pathname)
        // Sign out before redirecting to sign in page incase the user is stuck in a loading state
        signOut().finally(() => {
          location.href = `/sign-in?${searchParams.toString()}`
        })
      } else {
        timeout = window.setInterval(() => refreshSession(), 10000)
      }
    }
    return () => {
      if (timeout) window.clearInterval(timeout)
    }
  }, [state])

  const value = useMemo(() => {
    return { ...state, refreshSession } as const
  }, [state, refreshSession, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* Auth Utils */

export const useAuth = () => useContext(AuthContext)

export const useSession = (): Session | null => {
  if (typeof window !== 'undefined') {
    return useAuth().session
  }
  return null
}

export const useUser = () => useSession()?.user ?? null

export const useIsUserLoading = () => useAuth().isLoading

export const useIsLoggedIn = () => {
  const user = useUser()
  return user !== null
}

export const useAuthError = () => useAuth()?.error

export const useIsMFAEnabled = () => {
  const user = useUser()
  return user !== null && user.factors && user.factors.length > 0
}

export const signOut = async () => authSignOut()

export const logOut = async () => {
  clearLocalStorage()
  await signOut()
}

export const isExpired = (expiresIn?: number) => {
  if (!expiresIn) {
    const session = useSession()
    expiresIn = session?.expires_in || 0
  }
  return new Date().getTime() / 1000 > expiresIn - 30
}
