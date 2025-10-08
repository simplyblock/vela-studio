export const materializedViewKeys = {
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'materializedViews'] as const,
  listBySchema: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema: string
  ) => [...materializedViewKeys.list(orgId, projectId, branchId), schema] as const,
}
