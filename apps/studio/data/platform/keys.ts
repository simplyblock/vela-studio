export const platformKeys = {
  serviceUrls: () => ['platform', 'serviceUrls'] as const,
  status: () => ['platform', 'status'] as const,
  available_postgres_versions: () => ['platform', 'availablePostgresVersions'] as const,
}
