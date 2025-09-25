import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleGet = (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({status: 'ok'})
}

const apiHandler = apiBuilder(builder => builder.get(handleGet))

export default apiHandler
