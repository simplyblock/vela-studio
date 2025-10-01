import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { ProjectDetail } from '../projects/project-detail-query'

export function useLastVisitedBranch(project: ProjectDetail | undefined) {
  const lastBranchByProject = `last-branch-${project?.ref ?? 'unknown'}`
  return useLocalStorageQuery<string>(lastBranchByProject, project?.default_branch ?? 'main')
}