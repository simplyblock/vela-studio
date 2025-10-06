export const configKeys = {
  settings: (projectRef: string | undefined) => ['projects', projectRef, 'settings'] as const,
  settingsV2: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['projects', orgSlug, projectRef, 'settings-v2'] as const,
  api: (projectRef: string | undefined) => ['projects', projectRef, 'settings', 'api'] as const,
  postgrest: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'postgrest'] as const,
  jwtSecretUpdatingStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jwt-secret-updating-status'] as const,
  storage: (projectRef: string | undefined) => ['projects', projectRef, 'storage'] as const,
  upgradeEligibility: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'upgrade-eligibility'] as const,
  upgradeStatus: (orgSlug: string | undefined, projectRef: string | undefined) =>
    ['projects', orgSlug, projectRef, 'upgrade-status'] as const,
  diskAttributes: (projectRef: string | undefined) =>
    ['projects', projectRef, 'disk-attributes'] as const,
  diskBreakdown: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'disk-breakdown'] as const,
  diskUtilization: (projectRef: string | undefined) =>
    ['projects', projectRef, 'disk-utilization'] as const,
  projectCreationPostgresVersions: (organizationSlug: string | undefined, dbRegion: string) =>
    ['projects', organizationSlug, dbRegion, 'available-creation-versions'] as const,
  projectUnpausePostgresVersions: (projectRef: string | undefined) =>
    ['projects', projectRef, 'available-unpause-versions'] as const,
  diskAutoscaleConfig: (projectRef: string | undefined) =>
    ['projects', projectRef, 'disk-autoscale-config'] as const,
}
