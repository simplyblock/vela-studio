import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const client = getVelaClient(req)
  return client.proxyGet(res, '/system/available-postgresql-versions')
}

const apiHandler = apiBuilder((builder) => builder.get(handleGet))

export default apiHandler
