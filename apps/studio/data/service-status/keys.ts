export const serviceStatusKeys = {
  postgres: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'postgres'] as const,
  pooler: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'pooler'] as const,
  serviceStatus: (orgSlug: string | undefined, projectRef: string | undefined, branchRef: string | undefined) =>
    ['projects', orgSlug, projectRef, branchRef, 'service-status'] as const,
  edgeFunctions: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'edge-functions'] as const,
}
