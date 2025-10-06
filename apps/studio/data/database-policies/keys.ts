export const databasePoliciesKeys = {
  list: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema?: string
  ) => ['branches', orgId, projectId, branchId, 'database-policies', schema].filter(Boolean),
}
