import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

// FIXME: Implementation missing
const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty data structure that prevents null/undefined access
  return res.status(200).json({
    data: {
      exceptions: [],
      meta: {
        count: 0,
        page: 0,
        totalPages: 0,
      },
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
      projectRef: ref,
      status: 'active',
      properties: {},
    },
    error: null,
  })
}

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { ref } = getPlatformQueryParams(req, 'ref')

  // Return empty response that prevents null/undefined access
  return res.status(200).json({
    data: true,
    error: null,
  })
}

const apiHandler = apiBuilder((builder) => {
  builder.useAuth().get(handleGet).post(handlePost).delete(handleDelete)
})

export default apiHandler
