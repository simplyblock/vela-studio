import { NextApiRequest, NextApiResponse } from 'next'
import { getVelaClient } from 'data/vela/vela'

export async function buildProjectByBranchLookup(
  organizationId: string,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Record<string, string | false>> {
  const client = getVelaClient(req)
  const { data: projects, success: projectsSuccess } = await client.getOrFail(
    res,
    '/organizations/{organization_id}/projects/',
    {
      params: {
        path: {
          organization_id: organizationId,
        },
      },
    }
  )

  if (!projectsSuccess) throw new Error('Failed to read projects')

  const projectIdCache: Record<string, string | false> = {}
  for (const project of projects) {
    const { data: branches, success } = await client.getOrFail(
      res,
      '/organizations/{organization_id}/projects/{project_id}/branches/',
      {
        params: {
          path: {
            organization_id: organizationId,
            project_id: project.id,
          },
        },
      }
    )

    if (!success) throw new Error('Failed to read branches')
    for (const branch of branches) {
      projectIdCache[branch.id] = project.id
    }
  }
  return projectIdCache
}
