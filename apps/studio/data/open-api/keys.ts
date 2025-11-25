export const openApiKeys = {
  apiSpec: (
    orgSlug: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined
  ) => ['projects', orgSlug, projectRef, branchRef, 'open-api-spec'] as const,
}
