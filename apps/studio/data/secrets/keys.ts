export const secretsKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['projects', orgSlug, projectRef, 'edge_functions_secrets'] as const,
}
