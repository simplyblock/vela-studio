import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

interface SecretResponse {
  name: string
  updated_at?: string
  value: string
}

const handleGet = (req: NextApiRequest, res: NextApiResponse<SecretResponse[]>) => {
  return res.status(200).json([])
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
