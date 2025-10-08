export const tableKeys = {
  list: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema?: string,
    includeColumns?: boolean
  ) => ['branches', orgId, projectId, branchId, 'tables', schema, includeColumns].filter(Boolean),
  retrieve: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    name: string,
    schema: string
  ) => ['branches', orgId, projectId, branchId, 'tables', schema, name].filter(Boolean),
  rolesAccess: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema: string,
    table: string
  ) => ['branches', orgId, projectId, branchId, 'roles-access', { schema, table }],
}
