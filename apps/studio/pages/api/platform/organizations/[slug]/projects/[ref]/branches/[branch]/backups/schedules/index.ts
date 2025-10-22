import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

interface BackupSchedule {
  backup_schedule_id: string
  organization_id: string
  project_id: string
  branch_id?: string
  env_type?: string
  rows: {
    row_index: number
    interval: number
    unit: string
    retention: number
  }[]
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const response = await client.get('/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
    },
  })

  if (maybeHandleError(res, response, validStatusCodes(200, 404))) return
  if (response.response.status === 404) return res.json([])

  return res.json(
    response.data?.map((schedule): BackupSchedule => {
      return {
        backup_schedule_id: schedule.id,
        organization_id: slug,
        project_id: ref,
        branch_id: schedule.branch_id ?? undefined,
        env_type: schedule.env_type ?? undefined,
        rows: schedule.rows,
      }
    }) || []
  )
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const { data, success } = await client.postOrFail(res, '/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
    },
    body: req.body,
  })

  if (!success) return

  const schedule = data as { status: string; schedule_id: string }
  return res.json({
    backup_schedule_id: schedule.schedule_id,
    organization_id: slug,
    env_type: req.body.env_type,
    rows: req.body.rows,
  })
}

const handlePut = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug, ref, branch } = getPlatformQueryParams(req, 'slug', 'ref', 'branch')

  const client = getVelaClient(req)
  const { data, success } = await client.putOrFail(res, '/backup/branches/{branch_id}/schedule', {
    params: {
      path: {
        branch_id: branch,
      },
    },
    body: req.body,
  })

  if (!success) return

  const schedule = data as { status: string; schedule_id: string }
  return res.json({
    backup_schedule_id: schedule.schedule_id,
    organization_id: slug,
    env_type: req.body.env_type,
    rows: req.body.rows,
  })
}

const apiHandler = apiBuilder((builder) =>
  builder.useAuth().get(handleGet).post(handlePost).put(handlePut)
)

export default apiHandler
