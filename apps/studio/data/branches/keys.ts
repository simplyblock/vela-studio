export const branchKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) => ['projects', projectRef, 'branches'] as const,
  detail: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'branches', id] as const,
  diff: (projectRef: string | undefined, branchId: string | undefined) =>
    ['projects', projectRef, 'branch', branchId, 'diff'] as const,
}
