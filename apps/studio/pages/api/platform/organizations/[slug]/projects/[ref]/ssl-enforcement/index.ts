import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface SslEnforcementResponse {
  appliedSuccessfully: boolean
  currentConfig: {
    database: boolean
  }
}

interface SslEnforcementRequest {
  requestedConfig: {
    database: boolean
  }
}

const handleGet = (req: NextApiRequest, res: NextApiResponse<SslEnforcementResponse>) => {
  return res.status(200).json({
    appliedSuccessfully: false,
    currentConfig: {
      database: false
    }
  })
}

const handlePut = (req: NextApiRequest, res: NextApiResponse<SslEnforcementResponse>) => {
  return res.status(200).json({
    appliedSuccessfully: false,
    currentConfig: {
      database: false
    }
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet).put(handlePut))

export default apiHandler
