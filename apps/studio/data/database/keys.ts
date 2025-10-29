export const databaseKeys = {
  schemas: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'schemas'] as const,
  keywords: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'keywords'] as const,
  migrations: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'migrations'] as const,
  tableColumns: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema: string | undefined,
    table: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'table-columns', schema, table] as const,
  databaseFunctions: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'database-functions'] as const,
  entityDefinition: (projectRef: string | undefined, id?: number) =>
    ['projects', projectRef, 'entity-definition', id] as const,
  entityDefinitions: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schemas: string[]
  ) => ['branches', orgId, projectId, branchId, 'entity-definitions', schemas] as const,
  tableDefinition: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id?: number
  ) => ['branches', orgId, projectId, branchId, 'table-definition', id] as const,
  viewDefinition: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id?: number
  ) => ['branches', orgId, projectId, branchId, 'view-definition', id] as const,
  backups: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'pooling-configuration'] as const,
  indexesFromQuery: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    query: string
  ) => ['branches', orgId, projectId, branchId, 'indexes', { query }] as const,
  indexAdvisorFromQuery: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    query: string
  ) => ['branches', orgId, projectId, branchId, 'index-advisor', { query }] as const,
  tableConstraints: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id?: number
  ) => ['branches', orgId, projectId, branchId, 'table-constraints', id] as const,
  foreignKeyConstraints: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    schema?: string
  ) => ['branches', orgId, projectId, branchId, 'foreign-key-constraints', schema] as const,
  databaseSize: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'database-size'] as const,
  maxConnections: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined
  ) => ['branches', orgId, projectId, branchId, 'max-connections'] as const,
  pgbouncerStatus: (
    orgSlug: string | undefined,
    projectRef: string | undefined,
    branchId: string | undefined
  ) => ['projects', orgSlug, projectRef, branchId, 'pgbouncer', 'status'] as const,
  pgbouncerConfig: (
    orgSlug: string | undefined,
    projectRef: string | undefined,
    branchId: string | undefined
  ) => ['projects', orgSlug, projectRef, branchId, 'pgbouncer', 'config'] as const,
}
