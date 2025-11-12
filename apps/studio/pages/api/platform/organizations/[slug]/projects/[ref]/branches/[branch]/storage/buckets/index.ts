import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { newStorageClient } from 'lib/storage/storage-client'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })
  return await storageClient.getBuckets()
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id, public: isPublicBucket } = req.body
  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })
  return await storageClient.createBucket(id, isPublicBucket)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
