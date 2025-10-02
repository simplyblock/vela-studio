import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchesVariables = {
  orgSlug?: string
  projectRef?: string
}

interface DatabaseInformation {
  host: string
  port: number
  username: string
  name: string
  password?: string // only at creation time
  encrypted_connection_string: string
  service_endpoint_uri: string
  version: string
}

export interface Branch {
  id: string
  name: string
  project_id: string
  organization_id: string
  database: DatabaseInformation & {
    has_replicas: boolean
  }
  pitr_enabled: boolean
  assigned_labels: string[]
  used_resources: {
    vcpu: number
    ram_mb: number
    nvme_gb: number
    iops: number
    storage_gb?: number
  }
  max_resources: {
    vcpu: number
    ram_mb: number
    nvme_gb: number
    iops: number
    storage_gb?: number
  }
  api_keys: {
    anon: string
    service_role: string
  }
  status: {
    database:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UPDATING'
      | 'RESTARTING'
      | 'STOPPING'
      | 'UNKNOWN'
    storage:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UNKNOWN'
    realtime:
      | 'ACTIVE_HEALTHY'
      | 'STOPPED'
      | 'STARTING'
      | 'ACTIVE_UNHEALTHY'
      | 'CREATING'
      | 'DELETING'
      | 'UNKNOWN'
  }
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}


export async function getBranches(
  { orgSlug, projectRef }: BranchesVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/branches`, {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef,
      },
    },
    signal,
  })

  if (error) {
    if ((error as ResponseError).message === 'Preview branching is not enabled for this project.') {
      return []
    } else {
      handleError(error)
    }
  }

  return data as unknown as BranchesData
}

export type BranchesData = Branch[]
export type BranchesError = ResponseError

export const useBranchesQuery = <TData = BranchesData>(
  { orgSlug, projectRef }: BranchesVariables,
  { enabled = true, ...options }: UseQueryOptions<BranchesData, BranchesError, TData> = {}
) =>
  useQuery<BranchesData, BranchesError, TData>(
    branchKeys.list(orgSlug, projectRef),
    ({ signal }) => getBranches({ orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined', ...options }
  )
