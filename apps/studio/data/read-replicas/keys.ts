export const replicaKeys = {
  list: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['project', orgSlug, projectRef, 'replicas'] as const,
  statuses: (projectRef: string | undefined) =>
    ['project', projectRef, 'replicas-statuses'] as const,
  loadBalancers: (projectRef: string | undefined) =>
    ['project', projectRef, 'load-balancers'] as const,
  replicaLag: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id: string
  ) => ['branches', orgId, projectId, branchId, 'replica-lag', id] as const,
}
