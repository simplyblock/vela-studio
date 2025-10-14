import { apiBuilder } from 'lib/api/apiBuilder'
import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'
import { getPlatformQueryParams } from 'lib/api/platformQueryParams'
import { buildProjectByBranchLookup } from 'lib/api/projectByBranchLookup'

interface VelaBackup {
  branch_id: string
  backup_uuid: string
  row_index: number
  created_at: string
}

interface Backup {
  id: string
  organization_id: string
  project_id: string
  branch_id: string
  row_index: number
  created_at: string
}

const handleGet = async (req: NextApiRequest, res: NextApiResponse<Backup>) => {
  const { slug } = getPlatformQueryParams(req, 'slug')

  const client = getVelaClient(req)
  const { data: backups, success: backupSuccess } = await client.getOrFail(
    res,
    '/backup/organizations/{org_ref}/',
    {
      params: {
        path: {
          org_ref: slug,
        },
      },
    }
  )

  if (!backupSuccess) return

  const projectsByBranch = await buildProjectByBranchLookup(slug, req, res)
  const getProjectId = (branchId: string) => {
    const cached = projectsByBranch[branchId]
    if (cached === undefined || cached === false) throw new Error('Project not found')
    return cached
  }

  return (backups as VelaBackup[]).map((backup): Backup => {
    return {
      id: backup.backup_uuid,
      organization_id: slug,
      project_id: getProjectId(backup.branch_id),
      branch_id: backup.branch_id,
      row_index: backup.row_index,
      created_at: backup.created_at,
    }
  })
}

const apiHandler = apiBuilder((builder) => builder.useAuth().get(handleGet))

export default apiHandler
