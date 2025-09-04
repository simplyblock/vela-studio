import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from '../../../../../../../../../lib/api/apiBuilder'

interface Response {
  update_status: {
    change_tracking_id: string
    /** @enum {number} */
    error?: 0 | 1 | 2 | 3 | 4 | 5
    /** @enum {number} */
    progress: 0 | 1 | 2 | 3 | 4 | 5
    /** @enum {number} */
    status: 0 | 1 | 2
  } | null
}

// FIXME: Missing implementation
const handleGet = (req: NextApiRequest, res: NextApiResponse) => {
  const response: Response = {
    update_status: null
  }
  return res.status(200).json(response)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
