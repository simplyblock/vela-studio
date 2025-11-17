export const logDrainsKeys = {
  list: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined
  ) => ['branches', orgRef, projectRef, branchRef, 'log-drains'] as const,
}
