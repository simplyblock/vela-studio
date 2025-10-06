export const databaseTriggerKeys = {
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'database-triggers'] as const,
  resource: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'resources', id] as const,
}
