export const privilegeKeys = {
  tablePrivilegesList: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => [orgId, projectId, branchId, 'database', 'table-privileges'] as const,
  columnPrivilegesList: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => [orgId, projectId, branchId, 'database', 'column-privileges'] as const,
}
