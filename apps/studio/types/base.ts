import { PermissionsData } from '../data/permissions/permissions-query'
import { RolesData } from '../data/permissions/roles-query'
import { OrganizationRolesData } from '../data/organizations/organization-roles-query'
import { components } from '../data/vela/vela-schema'

export type ArrayElement<T> = T extends (infer U)[] ? U : never

export type Organization = Omit<components['schemas']['Organization'], "environments"> & {
  env_types?: string[]
}

/**
 * @deprecated Please use type from projects-query OR project-details-query.ts instead
 */
export interface ProjectBase {
  id: number
  ref: string
  name: string
  status: string
  organization_id: number
  cloud_provider: string
  region: string
  inserted_at: string
  subscription_id: string
  preview_branch_refs: string[]
}

/**
 * @deprecated Please use type from project-details-query.ts instead
 */
export interface Project extends ProjectBase {
  // available after projects.fetchDetail
  dbVersion?: string
  restUrl?: string
  lastDatabaseResizeAt?: string | null
  maxDatabasePreprovisionGb?: string | null
  parent_project_ref?: string
  is_branch_enabled?: boolean

  /**
   * postgrestStatus is available on client side only.
   * We use this status to check if a project instance is HEALTHY or not
   * If not we will show ConnectingState and run a polling until it's back online
   */
  postgrestStatus?: 'ONLINE' | 'OFFLINE'
  /**
   * Only available on client side only, for components that require the parentRef
   * irregardless of being on any branch, such as ProjectDropdown and Vercel integration
   * */
  parentRef?: string
  volumeSizeGb?: number
}

export interface User {
  id: string
  mobile?: string | null
  primary_email: string
  username: string
  first_name?: string
  last_name?: string
  user_id: string
  is_alpha_user: boolean
  free_project_limit: number
}

export type Role = ArrayElement<RolesData>

export type ResourcePermission = ArrayElement<PermissionsData>

export type OrganizationRole = ArrayElement<OrganizationRolesData>

export interface Permission {
  entity: 'org' | 'env' | 'project' | 'branch'
  resource: string
  action: string
}

export interface ResponseFailure {
  error: ResponseError
}

export type SupaResponse<T> = T | ResponseFailure

export class ResponseError extends Error {
  code?: number
  requestId?: string
  retryAfter?: number
  detail?: any[]

  constructor(message: string | undefined, code?: number, requestId?: string, retryAfter?: number, detail?: any[]) {
    super(message || 'API error happened while trying to communicate with the server.')
    this.code = code
    this.requestId = requestId
    this.retryAfter = retryAfter
    this.detail = detail
  }
}

export interface Dictionary<T> {
  [Key: string]: T
}
