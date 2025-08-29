import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty data structure that prevents null/undefined access
  return res.status(200).json({
    data: {
      fileUrl: '',
      expiresAt: new Date().toISOString(),
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    error: null,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty response that prevents null/undefined access
  return res.status(200).json({
    data: {
      id: '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
