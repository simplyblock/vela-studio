export const authKeys = {
  users2: (
    projectRef: string | undefined,
    params?: {
      page: number | undefined
      keywords: string | undefined
      filter: string | undefined
    }
  ) => ['projects', projectRef, 'users', ...(params ? [params] : [])] as const,

  usersInfinite: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    params?: {
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
      sort: string | undefined
      order: string | undefined
    }
  ) =>
    [
      'branches',
      orgId,
      projectId,
      branchId,
      'users-infinite',
      ...(params ? [params].filter(Boolean) : []),
    ] as const,
  usersCount: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    params?: {
      keywords: string | undefined
      filter: string | undefined
      providers: string[] | undefined
    }
  ) =>
    [
      'branches',
      orgId,
      projectId,
      branchId,
      'users-count',
      ...(params ? [params].filter(Boolean) : []),
    ] as const,

  authConfig: (projectRef: string | undefined) => ['projects', projectRef, 'auth-config'] as const,
  accessToken: () => ['access-token'] as const,
}
