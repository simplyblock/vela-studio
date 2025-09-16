import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'

interface BackupsResponse {
  backups: {
    id: number
    inserted_at: string
    isPhysicalBackup: boolean
    project_id: number
    /** @enum {string} */
    status: 'COMPLETED' | 'FAILED' | 'PENDING' | 'REMOVED' | 'ARCHIVED' | 'CANCELLED'
  }[]
  physicalBackupData: {
    earliestPhysicalBackupDateUnix?: number
    latestPhysicalBackupDateUnix?: number
  }
  pitr_enabled: boolean
  region: string
  tierKey: string
  walg_enabled: boolean
}

// FIXME: Missing implementation
const handleGet = (req: NextApiRequest, res: NextApiResponse<BackupsResponse>) => {
  return res.status(200).json({
    backups: [],
    physicalBackupData: {},
    pitr_enabled: true,
    region: '',
    tierKey: '',
    walg_enabled: false,
  })
}

const apiHandler = apiBuilder(builder => builder.useAuth().get(handleGet))

export default apiHandler
