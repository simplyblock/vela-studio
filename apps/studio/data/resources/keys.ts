export const resourcesKeys = {
  organizationUsage: (orgSlug?: string) =>
    ['organizations', orgSlug, 'resources', 'usage'] as const,
  projectUsage: (orgSlug?: string, projectRef?: string) =>
    ['projects', orgSlug, projectRef, 'resources', 'usage'] as const,
  organizationLimits: (orgSlug?: string) =>
    ['organizations', orgSlug, 'resources', 'limits'] as const,
  projectLimits: (orgSlug?: string, projectRef?: string) =>
    ['projects', orgSlug, projectRef, 'resources', 'limits'] as const,
  branchEffectiveLimits: (orgSlug?: string, projectRef?: string, branchId?: string) =>
    ['branches', orgSlug, projectRef, branchId, 'resources', 'limits'] as const,
}
