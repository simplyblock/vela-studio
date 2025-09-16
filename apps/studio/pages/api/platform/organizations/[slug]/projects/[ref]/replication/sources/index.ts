import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface ReplicationSourcesResponse {
  /** @description List of sources */
  sources: {
    /** @description Source config */
    config: {
      /** @description Source host */
      host: string
      /** @description Source name */
      name: string
      /** @description Source port */
      port: number
      /** @description Source username */
      username: string
    }
    /** @description Source id */
    id: number
    /** @description Source name */
    name: string
    /** @description Tenant id */
    tenant_id: string
  }[]
}

// FIXME: Missing implementation
const handleGet = (req: NextApiRequest, res: NextApiResponse<ReplicationSourcesResponse>) => {
  return res.status(200).json({
    sources: [],
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
