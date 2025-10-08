export const apiKeysKeys = {
  list: (orgId?: string, projectId?: string, branchId?: string, reveal?: boolean) =>
    ['branches', orgId, projectId, branchId, 'api-keys', reveal].filter(Boolean),
  single: (projectRef?: string, id?: string) => ['projects', projectRef, 'api-keys', id] as const,
  status: (projectRef?: string) => ['projects', projectRef, 'api-keys', 'legacy'] as const,
}
