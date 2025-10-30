export const customDomainKeys = {
  list: (
    orgRef: string | undefined,
    projectRef: string | undefined,
    branchRef: string | undefined
  ) => ['projects', orgRef, projectRef, branchRef, 'custom-domains'] as const,
}
