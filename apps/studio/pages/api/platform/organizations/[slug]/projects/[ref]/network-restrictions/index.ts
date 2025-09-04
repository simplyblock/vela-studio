import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

interface NetworkRestrictionsResponse {
  /** @description At any given point in time, this is the config that the user has requested be applied to their project. The `status` field indicates if it has been applied to the project, or is pending. When an updated config is received, the applied config is moved to `old_config`. */
  config: {
    dbAllowedCidrs?: string[]
    dbAllowedCidrsV6?: string[]
  }
  /** @enum {string} */
  entitlement: 'disallowed' | 'allowed'
  /** @description Populated when a new config has been received, but not registered as successfully applied to a project. */
  old_config?: {
    dbAllowedCidrs?: string[]
    dbAllowedCidrsV6?: string[]
  }
  /** @enum {string} */
  status: 'stored' | 'applied'
}

// FIXME: missing implementation
const handleGet = (req: NextApiRequest, res: NextApiResponse<NetworkRestrictionsResponse>)=> {
  return res.status(200).json({
    config: {},
    entitlement: 'allowed',
    status: 'applied',
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
