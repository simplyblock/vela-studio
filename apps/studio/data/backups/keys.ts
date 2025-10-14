export const backupKeys = {
  orgBackups: (orgId: string | undefined) => ['organizations', orgId, 'backups'] as const,
  branchBackups: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['organizations', orgId, projectId, branchId, 'backups'] as const,
}
