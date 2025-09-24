import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from '../../../../../../../../data/vela/vela'
import { apiBuilder } from '../../../../../../../../lib/api/apiBuilder'

// FIXME: Implementation missing
const handleGetAll = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref } = req.query
  const client = getVelaClient(req)

  return res.status(200).json([])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGetAll))

export default apiHandler