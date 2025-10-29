export const branchKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['organizations', orgSlug, 'projects', projectRef, 'branches'] as const,
  detail: (orgSlug: string | undefined, projectRef: string | undefined, id: string | undefined) =>
    ['organizations', orgSlug, 'projects', projectRef, 'branches', id] as const,
}
