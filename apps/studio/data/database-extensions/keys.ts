export const databaseExtensionsKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined, branch: string | undefined) =>
    ['branches', orgSlug, projectRef, branch, 'database-extensions'] as const,
}
