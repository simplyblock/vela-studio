import { NextApiRequest } from 'next'
import { getPlatformQueryParams } from './platformQueryParams'
import { isDocker } from '../docker'

const isInDocker = isDocker()

export function getPgMetaUrl(req: NextApiRequest) {
  const { branch } = getPlatformQueryParams(req, 'branch')

  if (isInDocker) {
    return process.env.PLATFORM_PG_META_URL
  }
  return `http://supabase-supabase-meta.vela-${branch.toLowerCase()}.svc.cluster.local:8080`
}