import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  return res.status(405).json({ message: 'not allowed to set up custom domain' })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
