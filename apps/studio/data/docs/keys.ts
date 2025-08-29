export const docsKeys = {
  jsonSchema: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', orgSlug, projectRef, 'docs'] as const,
}
