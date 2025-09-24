import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from '../../../../../../lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = req.query

  const client = getVelaClient(req)

  return res.status(200).json([])
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
