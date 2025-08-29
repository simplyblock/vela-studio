import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({
    data: {
      isHealthy: true,
      services: {
        api: {
          status: 'operational',
          latency: 0,
        },
        database: {
          status: 'operational',
          latency: 0,
        },
        storage: {
          status: 'operational',
          latency: 0,
        },
        auth: {
          status: 'operational',
          latency: 0,
        },
        realtime: {
          status: 'operational',
          latency: 0,
        },
      },
      timestamp: new Date().toISOString(),
      version: '',
      message: '',
    },
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet)
})

export default apiHandler
