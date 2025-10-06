export const databaseCronJobsKeys = {
  create: () => ['cron-jobs', 'create'] as const,
  delete: () => ['cron-jobs', 'delete'] as const,
  alter: () => ['cronjobs', 'alter'] as const,
  job: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    identifier: number | string | undefined
  ) => ['branches', orgId, projectId, branchId, 'cron-jobs', identifier] as const,
  listInfinite: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    searchTerm: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'cron-jobs', { searchTerm }] as const,
  count: (orgId: string | undefined, projectId: string | undefined, branchId: string | undefined) =>
    ['branches', orgId, projectId, branchId, 'cron-jobs', 'count'] as const,
  run: (projectRef: string | undefined, jobId: number) => [
    'projects',
    projectRef,
    'cron-jobs',
    jobId,
    'run',
  ],
  runsInfinite: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    jobId: number,
    options?: object
  ) => ['branches', orgId, projectId, branchId, 'cron-jobs', jobId, options],
  timezone: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['database-cron-timezone', orgId, projectId, branchId] as const,
}
