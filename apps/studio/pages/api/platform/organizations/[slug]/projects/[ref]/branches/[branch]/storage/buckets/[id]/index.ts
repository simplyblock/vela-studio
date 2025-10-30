import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { newStorageClient } from 'lib/storage/storage-client'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return
  return await storageClient.deleteBucket(id)
}

const handlePatch = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const { public: isPublicBucket } = req.body
  const storageClient = await newStorageClient(req, res)
  if (!storageClient)return
  return await storageClient.updateBucket(id, isPublicBucket)
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().delete(handleDelete).patch(handlePatch)
)

export default apiHandler
