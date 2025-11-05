import { NextApiRequest } from 'next'
import { getPlatformQueryParams } from './platformQueryParams'
import { isDocker } from '../docker'

export function getPgMetaUrl(req: NextApiRequest) {
  const { branch } = getPlatformQueryParams(req, 'branch')

  if (isDocker()) {
    return process.env.PLATFORM_PG_META_URL
  }
  return `http://supabase-supabase-meta.vela-${branch.toLowerCase()}.svc.cluster.local:8080`
}