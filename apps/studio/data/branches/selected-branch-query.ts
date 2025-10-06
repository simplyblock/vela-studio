import { useParams } from 'common'
import { useBranchQuery } from './branch-query'

export const useSelectedBranchQuery = () => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams()
  return useBranchQuery({
    orgRef,
    projectRef,
    branchRef
  })
};