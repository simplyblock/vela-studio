import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

interface VelaBackupSchedule {
  ref: string
  organization_id: string
  branch_id: string
  env_type: string
  rows: {
    row_index: number
    interval: number
    unit: string
    retention: number
  }
}

interface BackupSchedule {
  backup_schedule_id: string
  organization_id: string
  project_id: string
  branch_id: string
  env_type: string
  rows: {
    row_index: number
    interval: number
    unit: string
    retention: number
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const { data, success } = await client.getOrFail(res, '/backup/branches/{branch_ref}/schedule', {
    params: {
      path: {
        branch_ref: branch,
      },
    },
  })

  if (!success) return

  const schedules = data as VelaBackupSchedule[]
  return schedules.map((schedule): BackupSchedule => {
    return {
      backup_schedule_id: schedule.ref,
      organization_id: slug,
      project_id: ref,
      branch_id: schedule.branch_id,
      env_type: schedule.env_type,
      rows: schedule.rows,
    }
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
