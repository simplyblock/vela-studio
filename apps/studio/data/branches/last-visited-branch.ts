import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ProjectDetail } from '../projects/project-detail-query'
import { useBranchesQuery } from './branches-query'

export function useLastVisitedBranch(project: ProjectDetail | undefined) {
  const lastBranchByProject = `last-branch-${project?.ref ?? 'unknown'}`
  const { data: branches } = useBranchesQuery({orgSlug: project?.organization_id, projectRef: project?.id})
  const mainBranch = branches?.find(branch => branch.name === project?.default_branch)
  const [lastUsedBranch] = useLocalStorageQuery<string>(lastBranchByProject, mainBranch?.id ?? 'main')
  if (lastUsedBranch !== 'main') {
    return lastUsedBranch
  }
  return mainBranch?.id ?? 'main'
}