export const openApiKeys = {
  apiSpec: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', orgSlug, projectRef, 'open-api-spec'] as const,
}
