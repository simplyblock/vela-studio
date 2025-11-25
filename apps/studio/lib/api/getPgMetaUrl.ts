import { NextApiRequest } from 'next'
import { getPlatformQueryParams } from './platformQueryParams'
import { isDocker } from '../docker'

const isInDocker = isDocker()

export function getPgMetaUrl(req: NextApiRequest) {
  const { branch } = getPlatformQueryParams(req, 'branch')

  if (isInDocker) {
    return process.env.PLATFORM_PG_META_URL
  }
  return `http://vela-meta.vela-${branch.toLowerCase()}.svc.cluster.local:8080`
}

/**
 * Construct the pgMeta redirection url passing along the filtering query params
 * @param req
 * @param endpoint
 */
export function getPgMetaRedirectUrl(req: NextApiRequest, endpoint: string) {
  const query = Object.entries(req.query).reduce((query, entry) => {
    const [key, value] = entry
    if (Array.isArray(value)) {
      for (const v of value) {
        query.append(key, v)
      }
    } else if (value) {
      query.set(key, value)
    }
    return query
  }, new URLSearchParams())

  const pgMetaEndpoint = getPgMetaUrl(req)
  let url = `${pgMetaEndpoint}/${endpoint}`
  if (Object.keys(req.query).length > 0) {
    url += `?${query}`
  }
  return url
}
