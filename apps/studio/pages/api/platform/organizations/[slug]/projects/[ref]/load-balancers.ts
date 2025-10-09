import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface LoadBalancerDetailResponse {
  databases: {
    identifier: string
    status: string
    /** @enum {string} */
    type: 'PRIMARY' | 'READ_REPLICA'
  }[]
  endpoint: string
}

const handleGet = (req: NextApiRequest, res: NextApiResponse<LoadBalancerDetailResponse[]>) => {
  return res.json([])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
