export const databaseIndexesKeys = {
  list: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema?: string
  ) => ['branches', orgId, projectId, branchId, 'database-indexes', schema].filter(Boolean),
}
