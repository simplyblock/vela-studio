import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { newStorageClient } from 'lib/storage/storage-client'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const { from, to } = req.body

  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })
  return storageClient.moveObject(id as string, from, to)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
