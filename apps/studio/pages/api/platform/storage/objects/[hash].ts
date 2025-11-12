import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'
import { newStorageClient } from 'lib/storage/storage-client'

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { hash, token } = req.query as {hash?: string, token?: string}
  if (!hash || !token) return res.status(401).json({ error: 'Missing hash or token' })

  const storageClient = await newStorageClient(req, res)
  if (!storageClient) return res.status(500).json({ error: 'Failed to created storage client' })

  return await storageClient.retrieveSignedObjectUrl(hash, token)
}

const apiHandler = apiBuilder(builder => builder.get(handleGet))

export default apiHandler
