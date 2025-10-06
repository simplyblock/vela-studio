export const lintKeys = {
  lint: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'lint'] as const,
  lintRules: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'lint-rules'] as const,
}
