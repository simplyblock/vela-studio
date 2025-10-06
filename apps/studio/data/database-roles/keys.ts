export const databaseRoleKeys = {
  databaseRoles: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'database-roles'] as const,
}
