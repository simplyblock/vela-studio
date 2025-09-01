import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty data structure that prevents null/undefined access
  return res.status(200).json({
    data: {
      accessKeyId: '',
      secretAccessKey: '',
      bucketId: '',
      bucketName: '',
      region: '',
      hostname: '',
      protocol: 'https',
      status: 'active',
      createdAt: '',
      updatedAt: '',
    },
    error: null,
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty response that prevents null/undefined access
  return res.status(200).json({
    data: {
      accessKeyId: '',
      secretAccessKey: '',
      bucketId: '',
      bucketName: '',
      region: '',
      hostname: '',
      protocol: 'https',
      status: 'active',
      createdAt: '',
      updatedAt: '',
    },
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost)
})

export default apiHandler
