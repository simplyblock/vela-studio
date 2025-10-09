import { NextApiRequest, NextApiResponse } from 'next'
import { apiBuilder } from 'lib/api/apiBuilder'

// FIXME: Implementation missing
interface ProjectResourceWarningsResponse {
  /** @enum {string|null} */
  auth_email_offender: 'critical' | 'warning' | null
  /** @enum {string|null} */
  auth_rate_limit_exhaustion: 'critical' | 'warning' | null
  /** @enum {string|null} */
  auth_restricted_email_sending: 'critical' | 'warning' | null
  /** @enum {string|null} */
  cpu_exhaustion: 'critical' | 'warning' | null
  /** @enum {string|null} */
  disk_io_exhaustion: 'critical' | 'warning' | null
  /** @enum {string|null} */
  disk_space_exhaustion: 'critical' | 'warning' | null
  is_readonly_mode_enabled: boolean
  /** @enum {string|null} */
  memory_and_swap_exhaustion: 'critical' | 'warning' | null
  /** @enum {string|null} */
  need_pitr: 'critical' | 'warning' | null
  project: string
}

type Response = ProjectResourceWarningsResponse[]

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const response: Response = []
  return res.status(200).json(response)
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
