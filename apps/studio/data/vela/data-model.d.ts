export interface DatabaseInformation {
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
  id: number
  name: string
  slug: string
  project_slug: string
  organization_slug: string
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
  }
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}

export interface Project {
  id: number
  name: string
  slug: string
  organization_slug: string
  default_branch: string
  status:
    | 'ACTIVE'
    | 'STARTING'
    | 'STOPPED'
    | 'DELETING'
    | 'UNKNOWN'
  labels: string[]
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}

export interface Organization {
  id: number
  name: string
  slug: string
  created_at: string
  created_by: string
  updated_at?: string
  updated_by?: string
}

export interface ConnectionPoolSettings {
  pool_size: number
  max_connections: number
  label: string
  branch_slug?: string
  project_slug?: string
  organization_slug?: string
}
