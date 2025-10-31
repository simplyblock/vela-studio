import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { newStorageClient } from 'lib/storage/storage-client'

const handleDelete = async (req: NextApiRequest, res: NextApiResponse) => {
  const { id } = getPlatformQueryParams(req, 'id')
  const { paths } = req.body
  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return
  return storageClient.deleteObject(id, paths)
}

const apiHandler = apiBuilder((builder) => builder.useAuth().delete(handleDelete))

export default apiHandler
