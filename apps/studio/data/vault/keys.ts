export const vaultSecretsKeys = {
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'secrets'] as const,
  getDecryptedValue: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id: string
  ) => ['branches', orgId, projectId, branchId, 'secrets', id] as const,
}
