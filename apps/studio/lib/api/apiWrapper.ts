import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

import { ResponseError, ResponseFailure } from 'types'
import { getKeycloakManager } from 'common/keycloak'

export function isResponseOk<T>(response: T | ResponseFailure | undefined): response is T {
  if (response === undefined || response === null) {
    return false
  }

  if (response instanceof ResponseError) {
    return false
  }

  if (typeof response === 'object' && 'error' in response && Boolean(response.error)) {
    return false
  }

  return true
}

// Purpose of this apiWrapper is to function like a global catchall for ANY errors
// It's a safety net as the API service should never drop, nor fail

export default async function apiWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: NextApiHandler,
  options?: { withAuth: boolean }
) {
  try {
    const { withAuth } = options || {}

    if (withAuth) {
      const session = await getKeycloakManager().getSession(req, res)
      if (!session || !session.user) {
        return res.status(401).json({
          error: {
            message: `Unauthorized: No valid session found`,
          },
        })
      } else {
        // Attach user information to request parameters
        ;(req as any).user = session.user
      }
    }

    return handler(req, res)
  } catch (error: any) {
    if (error instanceof ResponseError) {
      return res.status(error.code || 500).json({ error: error.message })
    }
    if (error instanceof Error) {
      return res.status(500).json({ error: error.message })
    }
    console.log(error)
    return res.status(500).json({ error })
  }
}
