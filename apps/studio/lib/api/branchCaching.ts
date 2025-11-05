import { Cacheables } from 'cacheables'
import { Branch } from 'data/branches/branch-query'
import { NextApiRequest, NextApiResponse } from 'next'
import { getKeycloakManager } from 'common/keycloak'
import { getVelaClient, maybeHandleError } from '../../data/vela/vela'
import { getPlatformQueryParams } from './platformQueryParams'

const branchCache = new Cacheables()

const branchKey = (orgId: string, projectId: string, branchId: string) =>
  `${orgId}::${projectId}::${branchId}`

export function invalidateBranch(orgId: string, projectId: string, branchId: string) {
  branchCache.delete(branchKey(orgId, projectId, branchId))
}

export function getBranchOrRefresh(
  orgId: string,
  projectId: string,
  branchId: string,
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Branch | undefined> {
  const key = branchKey(orgId, projectId, branchId)
  return branchCache.cacheable(
    async () => {
      const session = await getKeycloakManager().getSession(req, res)
      const accessToken = session?.access_token
      if (!accessToken) {
        throw Error('Invalid access token')
      }
      const client = getVelaClient(req)
      const response = await client.get(
        '/organizations/{organization_id}/projects/{project_id}/branches/{branch_id}/',
        {
          params: {
            path: {
              organization_id: orgId,
              project_id: projectId,
              branch_id: branchId,
            },
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      if (maybeHandleError(res, response)) return
      return response.data!
    },
    key,
    {
      cachePolicy: 'max-age',
      maxAge: 10000,
    }
  )
}
