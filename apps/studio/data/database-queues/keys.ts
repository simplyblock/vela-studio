export const databaseQueuesKeys = {
  create: () => ['queues', 'create'] as const,
  delete: (name: string) => ['queues', name, 'delete'] as const,
  purge: (name: string) => ['queues', name, 'purge'] as const,
  getMessagesInfinite: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    queueName: string,
    options?: object
  ) =>
    ['branches', orgId, projectId, branchId, 'queue-messages', queueName, options].filter(Boolean),
  list: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'queues'] as const,
  metrics: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    queueName: string
  ) => ['branches', orgId, projectId, branchId, 'queue-metrics', queueName] as const,
  exposePostgrestStatus: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'queue-expose-status'] as const,
}
