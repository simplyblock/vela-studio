import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ProjectDetail } from '../projects/project-detail-query'
import { useBranchesQuery } from './branches-query'

export function useLastVisitedBranch(project: ProjectDetail | undefined) {
  const lastBranchByProject = `last-branch-${project?.ref ?? 'unknown'}`
  const { data: branches, isLoading } = useBranchesQuery({orgSlug: project?.organization_id, projectRef: project?.id})
  const mainBranch = branches?.find(branch => branch.name === project?.default_branch)
  const [lastUsedBranch] = useLocalStorageQuery<string>(lastBranchByProject, mainBranch?.id ?? '-')

  if (isLoading) {
    return { branchId: undefined, isLoading: true }
  }
  if (lastUsedBranch !== '-') {
    return { branchId: lastUsedBranch, isLoading: false }
  }
  return { branchId: mainBranch?.id, isLoading: false }
}
