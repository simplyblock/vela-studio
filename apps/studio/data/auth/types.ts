export type AuthVariables = {
  orgId?: string
  projectId?: string
  branchId?: string
}

export type UserVariables = AuthVariables & {
  userId?: string
}
