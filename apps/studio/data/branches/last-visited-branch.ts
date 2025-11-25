import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ProjectDetail } from '../projects/project-detail-query'
import { useBranchesQuery } from './branches-query'

export function useLastVisitedBranch(project: ProjectDetail | undefined) {
  const lastBranchByProject = `last-branch-${project?.id ?? 'unknown'}`
  const { data: branches, isLoading } = useBranchesQuery({orgRef: project?.organization_id, projectRef: project?.id})
  const onlyBranch = branches?.length === 1 ? branches[0] : undefined
  const [lastUsedBranch] = useLocalStorageQuery<string>(lastBranchByProject, onlyBranch?.id ?? '-')

  if (isLoading) {
    return { branchId: undefined, isLoading: true }
  }
  if (lastUsedBranch !== '-') {
    return { branchId: lastUsedBranch, isLoading: false }
  }
  return { branchId: onlyBranch?.id, isLoading: false }
}
