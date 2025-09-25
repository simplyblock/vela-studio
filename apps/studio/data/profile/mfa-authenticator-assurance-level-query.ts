import type { AuthMFAGetAuthenticatorAssuranceLevelResponse } from '@supabase/supabase-js'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { profileKeys } from './keys'
import type { Profile } from './types'

export type ProfileResponse = Profile

export async function getMfaAuthenticatorAssuranceLevel() {
  /*const { error, data } = await auth.mfa.getAuthenticatorAssuranceLevel()

  if (error) throw error
  return data*/ // FIXME: no idea what this does

  const fakeResponse: AuthMFAGetAuthenticatorAssuranceLevelResponse = {
    data: {
      currentLevel: null,
      nextLevel: null,
      currentAuthenticationMethods: [],
    },
    error: null,
  }
  return fakeResponse
}

type CustomAuthMFAGetAuthenticatorAssuranceLevelData = NonNullable<
  AuthMFAGetAuthenticatorAssuranceLevelResponse['data']
>
type CustomAuthMFAGetAuthenticatorAssuranceLevelError = NonNullable<
  AuthMFAGetAuthenticatorAssuranceLevelResponse['error']
>

export const useAuthenticatorAssuranceLevelQuery = <
  TData = CustomAuthMFAGetAuthenticatorAssuranceLevelData,
>({
  enabled = true,
  ...options
}: UseQueryOptions<
  CustomAuthMFAGetAuthenticatorAssuranceLevelData,
  CustomAuthMFAGetAuthenticatorAssuranceLevelError,
  TData
> = {}) => {
  return useQuery<
    CustomAuthMFAGetAuthenticatorAssuranceLevelData,
    CustomAuthMFAGetAuthenticatorAssuranceLevelError,
    TData
  >(profileKeys.aaLevel(), () => getMfaAuthenticatorAssuranceLevel(), {
    staleTime: 1000 * 60 * 30, // default good for 30 mins
    ...options,
  })
}
