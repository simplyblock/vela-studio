import apiWrapper from './apiWrapper'
import { NextApiHandler } from 'next/dist/shared/lib/utils'
import { NextApiRequest, NextApiResponse } from 'next'
import { getKeycloakManager } from 'common/keycloak'

export type ApiHandler = NextApiHandler

export interface ApiBuilder {
  useAuth(): ApiBuilder
  get(handler: ApiHandler): ApiBuilder
  post(handler: ApiHandler): ApiBuilder
  put(handler: ApiHandler): ApiBuilder
  delete(handler: ApiHandler): ApiBuilder
  patch(handler: ApiHandler): ApiBuilder
}

export function apiBuilder(builder: (builder: ApiBuilder) => void): ApiHandler {
  let useAuth = false
  const handlers: {
    GET?: ApiHandler
    POST?: ApiHandler
    PUT?: ApiHandler
    DELETE?: ApiHandler
    PATCH?: ApiHandler
  } = {}

  const apiBuilder: ApiBuilder = {
    useAuth(): ApiBuilder {
      useAuth = true
      return this
    },
    get(handler: ApiHandler): ApiBuilder {
      if (handlers.GET) {
        throw new Error('Only one GET handler can be defined')
      }
      handlers.GET = handler
      return this
    },
    post(handler: ApiHandler): ApiBuilder {
      if (handlers.POST) {
        throw new Error('Only one POST handler can be defined')
      }
      handlers.POST = handler
      return this
    },
    put(handler: ApiHandler): ApiBuilder {
      if (handlers.PUT) {
        throw new Error('Only one PUT handler can be defined')
      }
      handlers.PUT = handler
      return this
    },
    delete(handler: ApiHandler): ApiBuilder {
      if (handlers.DELETE) {
        throw new Error('Only one DELETE handler can be defined')
      }
      handlers.DELETE = handler
      return this
    },
    patch(handler: ApiHandler): ApiBuilder {
      if (handlers.PATCH) {
        throw new Error('Only one PATCH handler can be defined')
      }
      handlers.PATCH = handler
      return this
    },
  }

  builder(apiBuilder)

  const keys = Object.keys(handlers) as (keyof typeof handlers)[];
  const methods = [
    ...(keys.filter(
      (key) => handlers[key] !== undefined
    )),
  ]

  const handlerFunction = async (req: NextApiRequest, res: NextApiResponse) => {
    const method = req.method?.toUpperCase()
    if (!methods.includes(method as keyof typeof handlers)) {
      return res
        .status(405)
        .setHeader('Allow', methods)
        .json({ message: `Method ${method} not allowed` })
    }

    const handler = handlers[method as keyof typeof handlers]
    if (!handler) {
      return res.status(500).json({ message: 'Internal server error' })
    }

    try {
      return await handler(req, res)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ message: error.message })
      }
      return res.status(500).json({ message: error ? error : 'Unknown internal server error' })
    }
  }

  const keycloakManager = getKeycloakManager();
  return async (req, res) => {
    const session = await keycloakManager.getSession(req, res)
    if (session) {
      req.headers.authorization = `Bearer ${(session as any).access_token}`
    }
    return apiWrapper(req, res, handlerFunction, { withAuth: useAuth })
  }
}
