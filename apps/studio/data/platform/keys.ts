export const platformKeys = {
  status: () => ['platform', 'status'] as const,
  available_postgres_versions: () => ['platform', 'availablePostgresVersions'] as const,
}
