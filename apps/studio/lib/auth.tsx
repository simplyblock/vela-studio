import { useQueryClient } from '@tanstack/react-query'
import {
  AuthProvider as AuthProviderInternal,
  clearLocalStorage, signOut,
  useAuthError,
} from 'common'
import { PropsWithChildren, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { GOTRUE_ERRORS } from './constants'
import { SessionProvider } from 'next-auth/react'

const AuthErrorToaster = ({ children }: PropsWithChildren) => {
  const error = useAuthError()

  useEffect(() => {
    if (error !== null) {
      // Check for unverified GitHub users after a GitHub sign in
      if (error.message === GOTRUE_ERRORS.UNVERIFIED_GITHUB_USER) {
        toast.error(
          'Please verify your email on GitHub first, then reach out to us at support@supabase.io to log into the dashboard'
        )
        return
      }

      toast.error(error.message)
    }
  }, [error])

  return children
}

export const AuthProvider = ({ children }: PropsWithChildren) => {
  return (
    <SessionProvider>
      <AuthProviderInternal>
        <AuthErrorToaster>{children}</AuthErrorToaster>
      </AuthProviderInternal>
    </SessionProvider>
  )
}

export { useAuth, useIsLoggedIn, useSession, useUser } from 'common'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useCallback(async () => {
    const result = await signOut()
    clearLocalStorage()
    // Clear Assistant IndexedDB
    queryClient.clear()
    return result
  }, [queryClient])
}
