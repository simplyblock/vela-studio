import type { NextApiRequest, NextApiResponse } from 'next'
import type { ResponseError, SupaResponse, User } from 'types'
import { AuthClient, navigatorLock } from '@supabase/auth-js'
import { STORAGE_KEY } from 'common'
import { VELA_PLATFORM_GOTRUE_URL } from '../../pages/api/constants'

const navigatorLockEnabled = !!globalThis?.navigator?.locks
const gotrueClient = new AuthClient({
  url: VELA_PLATFORM_GOTRUE_URL,
  storageKey: STORAGE_KEY,
  detectSessionInUrl: true,
  debug: false,
  lock: navigatorLockEnabled ? navigatorLock : undefined,

  ...('localStorage' in globalThis
    ? { storage: globalThis.localStorage, userStorage: globalThis.localStorage }
    : null),
})

async function getAuthUser(token: String): Promise<any> {
  try {
    const {
      data: { user },
      error,
    } = await gotrueClient.getUser(token.replace('Bearer ', ''))
    if (error) throw error

    return { user, error: null }
  } catch (err) {
    console.error(err)
    return { user: null, error: err }
  }
}

/**
 * Use this method on api routes to check if user is authenticated and having required permissions.
 * This method can only be used from the server side.
 * Member permission is mandatory whenever orgSlug/projectRef query param exists
 * @param {NextApiRequest}    req
 * @param {NextApiResponse}   _res
 *
 * @returns {Object<user, error, description>}
 *   user null, with error and description if not authenticated or not enough permissions
 */
export async function apiAuthenticate(
  req: NextApiRequest,
  _res: NextApiResponse
): Promise<SupaResponse<User>> {
  try {
    const user = await fetchUser(req)
    if (!user) {
      return { error: new Error('The user does not exist') }
    }

    return user
  } catch (error) {
    return { error: error as ResponseError }
  }
}

/**
 * @returns
 *  user with only id prop or detail object. It depends on requireUserDetail config
 */
async function fetchUser(req: NextApiRequest): Promise<any> {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    throw new Error('missing access token')
  }
  const { user, error } = await getAuthUser(token)
  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('The user does not exist')
  }

  return user
}
