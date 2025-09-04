export const networkRestrictionKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['projects', orgSlug, projectRef, 'network-restrictions'] as const,
}
