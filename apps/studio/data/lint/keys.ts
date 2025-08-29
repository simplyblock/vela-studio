export const lintKeys = {
  lint: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', orgSlug, projectRef, 'lint'] as const,
  lintRules: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', orgSlug, projectRef, 'lint-rules'] as const,
}
