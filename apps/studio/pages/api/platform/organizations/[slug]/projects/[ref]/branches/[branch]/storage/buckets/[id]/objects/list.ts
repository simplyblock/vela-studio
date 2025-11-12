import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { newStorageClient } from 'lib/storage/storage-client'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })
  return storageClient.listObjects(id)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
