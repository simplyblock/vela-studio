import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { ServiceUrlsResponse } from 'common/hooks/useServiceUrls'
import { getVelaClient } from 'data/vela/vela'

const handleGet = (req: NextApiRequest, res: NextApiResponse<ServiceUrlsResponse>) => {
  const client = getVelaClient(req)
  return client.proxyGet(res, '/system/version')
}

const apiHandler = apiBuilder((builder) => builder.get(handleGet))

export default apiHandler
