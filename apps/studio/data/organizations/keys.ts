export const organizationKeys = {
  list: () => ['organizations'] as const,
  detail: (slug?: string) => ['organizations', slug] as const,
  members: (slug?: string) => ['organizations', slug, 'members'] as const,
  mfa: (slug?: string) => ['organizations', slug, 'mfa'] as const,
  roles: (slug: string | undefined) => ['organizations', slug, 'roles'] as const,
  freeProjectLimitCheck: (slug: string | undefined) =>
    ['organizations', slug, 'free-project-limit-check'] as const,
  customerProfile: (slug: string | undefined) =>
    ['organizations', slug, 'customer-profile'] as const,
  auditLogs: (
    slug: string | undefined,
    { date_start, date_end }: { date_start: string | undefined; date_end: string | undefined }
  ) => ['organizations', slug, 'audit-logs', { date_start, date_end }] as const,
}
