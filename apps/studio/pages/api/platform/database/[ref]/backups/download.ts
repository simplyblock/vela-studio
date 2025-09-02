import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const fakeResponse = {
      fileUrl: 'https://fake-download-url.com/backup.sql',
    }

    return res.status(200).json(fakeResponse)
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' })
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().post(handlePost))

export default apiHandler