export const sslEnforcementKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', orgSlug, projectRef, 'ssl-enforcement'] as const,
}
