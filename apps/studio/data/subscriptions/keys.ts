export const subscriptionKeys = {
  orgSubscription: (orgSlug: string | undefined) =>
    ['organizations', orgSlug, 'subscription'] as const,

  addons: (projectRef: string | undefined) => ['projects', projectRef, 'addons'] as const,
}
