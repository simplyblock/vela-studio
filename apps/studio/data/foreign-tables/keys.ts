export const foreignTableKeys = {
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'foreignTables'] as const,
  listBySchema: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema: string
  ) => [...foreignTableKeys.list(orgId, projectId, branchId), schema] as const,
}
