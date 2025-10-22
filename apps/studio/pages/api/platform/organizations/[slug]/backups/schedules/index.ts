import { NextApiRequest, NextApiResponse } from 'next'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { getVelaClient, maybeHandleError, validStatusCodes } from 'data/vela/vela'
import { apiBuilder } from 'lib/api/apiBuilder'

interface BackupSchedule {
  backup_schedule_id: string
  organization_id: string
  env_type?: string
  rows: {
    row_index: number
    interval: number
    unit: string
    retention: number
  }[]
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const response = await client.get('/backup/organizations/{organization_id}/schedule', {
    params: {
      path: {
        organization_id: slug,
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
        env_type: schedule.env_type ?? undefined,
        rows: schedule.rows,
      }
    }) || []
  )
}

const handlePost = async (req: NextApiRequest, res: NextApiResponse) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const { data, success } = await client.postOrFail(
    res,
    '/backup/organizations/{organization_id}/schedule',
    {
      params: {
        path: {
          organization_id: slug,
        },
      },
      body: req.body,
    }
  )

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
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const { data, success } = await client.putOrFail(
    res,
    '/backup/organizations/{organization_id}/schedule',
    {
      params: {
        path: {
          organization_id: slug,
        },
      },
      body: req.body,
    }
  )

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
