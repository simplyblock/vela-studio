import { Cacheables } from 'cacheables'
import { Branch } from 'data/branches/branch-query'

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
  retriever: () => Promise<Branch | undefined>
): Promise<Branch | undefined> {
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
