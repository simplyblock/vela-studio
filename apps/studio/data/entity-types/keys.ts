export const entityTypeKeys = {
  list: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    params?: {
      schemas?: string[]
      search?: string
      sort?: 'alphabetical' | 'grouped-alphabetical'
      limit?: number
      filterTypes?: string[]
    }
  ) =>
    ['branches', orgId, projectId, branchId, 'entity-types', ...(params ? [params] : [])] as const,
}
