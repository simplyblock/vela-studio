export const viewKeys = {
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'views'] as const,
  listBySchema: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema: string
  ) => [...viewKeys.list(orgId, projectId, branchId), schema] as const,
}
