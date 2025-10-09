import { Cacheables } from 'cacheables'
import { Branch } from 'api-types/types'

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
  retriever: () => Promise<Branch>
): Promise<Branch> {
  const key = branchKey(orgId, projectId, branchId)
  return branchCache.cacheable(
    () => {
      return retriever()
    },
    key,
    {
      cachePolicy: 'max-age',
      maxAge: 10000,
    }
  )
}
