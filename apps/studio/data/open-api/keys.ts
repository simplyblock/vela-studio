export const openApiKeys = {
  apiSpec: (
    orgSlug: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined
  ) => ['branches', orgSlug, projectRef, branchRef, 'open-api-spec'] as const,
}
