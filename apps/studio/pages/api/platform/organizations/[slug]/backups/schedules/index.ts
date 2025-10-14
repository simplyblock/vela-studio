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
  env_type?: string
  rows: {
    row_index: number
    interval: number
    unit: string
    retention: number
  }
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const { data, success } = await client.getOrFail(
    res,
    '/backup/organizations/{org_ref}/schedule',
    {
      params: {
        path: {
          org_ref: slug,
        },
      },
    }
  )

  if (!success) return

  return (data as VelaBackupSchedule[]).map((schedule): BackupSchedule => {
    return {
      backup_schedule_id: schedule.ref,
      organization_id: slug,
      env_type: schedule.env_type,
      rows: schedule.rows,
    } as BackupSchedule
  })
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const { data, success } = await client.postOrFail(
    res,
    '/backup/organizations/{org_ref}/schedule',
    {
      params: {
        path: {
          org_ref: slug,
        },
      },
      body: req.body,
    }
  )

  if (!success) return

  const schedule = data as { status: string; schedule_id: string }
  return {
    backup_schedule_id: schedule.schedule_id,
    organization_id: slug,
    env_type: req.body.env_type,
    rows: req.body.rows,
  }
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet).post(handlePost))

export default apiHandler
