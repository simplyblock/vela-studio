export const docsKeys = {
  jsonSchema: (
    orgSlug: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined
  ) => ['projects', orgSlug, projectRef, branchRef, 'docs'] as const,
}
