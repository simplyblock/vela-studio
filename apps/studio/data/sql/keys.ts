import type { QueryKey } from '@tanstack/react-query'

export const sqlKeys = {
  query: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    queryKey: QueryKey
  ) => ['branches', orgId, projectId, branchId, 'query', ...queryKey] as const,
  ongoingQueries: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'ongoing-queries'] as const,
}
