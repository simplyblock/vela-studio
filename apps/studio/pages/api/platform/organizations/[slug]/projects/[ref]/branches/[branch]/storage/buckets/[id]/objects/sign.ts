import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { newStorageClient } from 'lib/storage/storage-client'
import { compactVerify, CompactSign } from 'jose'

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const { path, expiresIn = 60 * 60 * 24 } = req.body

  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })
  return storageClient.createSignedObjectUrl(id, path, expiresIn)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler
