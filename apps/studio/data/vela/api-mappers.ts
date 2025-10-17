import { components } from './vela-schema'
import { Organization } from '../../types'
import { Project } from '../projects/project-detail-query'
import fs from 'node:fs'
import CryptoJS from 'crypto-js'
import { OrganizationMember } from '../organizations/organization-members-query'
import { Branch } from 'api-types/types'

export type VelaOrganization = components['schemas']['Organization']
export type VelaProject = components['schemas']['ProjectPublic']
export type VelaMember = components['schemas']['UserPublic']
export type VelaBranch = components['schemas']['BranchPublic']

const isDocker = fs.existsSync('/.dockerenv')
if (isDocker) console.log('Running in Docker, using fake encrypted connection string')

export function mapOrganization(organization: VelaOrganization): Organization {
  return {
    id: organization.id!,
    name: organization.name!,
    env_types: organization.environments.split(','),
    max_backups: organization.max_backups,
    slug: organization.id!,
    plan: {
      id: 'enterprise',
      name: 'Enterprise',
    },
    is_owner: false,
    opt_in_tags: [],
    organization_requires_mfa: false,
    restriction_data: {},
    restriction_status: null,
  }
}

export function mapProject(project: VelaProject): Project {
  return {
    id: project.id!,
    name: project.name!,
    ref: project.id!,
    max_backups: project.max_backups,
    organization_id: project.organization_id!,
    cloud_provider: 'vela',
    status: 'ACTIVE_HEALTHY',
    region: 'local',
    inserted_at: new Date().toISOString(),
    db_host: 'localhost',
    is_branch_enabled: false,
    is_physical_backups_enabled: false,
    restUrl: '',
    subscription_id: '',
    default_branch: 'main',
  }
}

export function mapOrganizationMember(member: VelaMember): OrganizationMember {
  // FIXME: Waiting for API object adjustment
  return {
    user_id: member.id,
    username: member.email,
    primary_email: member.email,
    mfa_enabled: false,
    is_sso_user: true,
    role_ids: [],
    metadata: {
      first_name: member.first_name,
      last_name: member.last_name,
    },
  }
}

export function mapProjectBranch(branch: VelaBranch): Branch {
  let encryptedConnectionString = branch.database.encrypted_connection_string
  if (isDocker) {
    encryptedConnectionString = CryptoJS.AES.encrypt(
      'postgresql://supabase_admin:your-super-secret-and-long-postgres-password@db:5432/postgres',
      'SAMPLE_KEY'
    )
      .toString()
      .trim() // FIXME: Encrypted connectionString needs to come from the outside
  }

  return {
    id: branch.id,
    created_at: branch.created_at,
    created_by: branch.created_by,
    name: branch.name,
    env_type: branch.env_type || '',
    project_id: branch.project_id,
    organization_id: branch.organization_id,
    status: branch.status,
    service_health: {
      database: branch.service_health.database,
      realtime: branch.service_health.realtime,
      storage: branch.service_health.storage,
      meta: branch.service_health.meta,
      rest: branch.service_health.rest
    },
    database: {
      host: branch.database.host,
      port: branch.database.port,
      name: branch.database.name,
      version: branch.database.version,
      username: branch.database.username,
      has_replicas: branch.database.has_replicas,
      service_endpoint_uri: branch.database.service_endpoint_uri,
      encrypted_connection_string: encryptedConnectionString,
    },
    pitr_enabled: branch.ptir_enabled,
    assigned_labels: branch.assigned_labels,
    used_resources: {
      vcpu: branch.used_resources.milli_vcpu,
      ram_bytes: branch.used_resources.ram_bytes,
      nvme_bytes: branch.used_resources.nvme_bytes,
      iops: branch.used_resources.iops,
      storage_bytes: branch.used_resources.storage_bytes ?? undefined,
    },
    max_resources: {
      vcpu: branch.max_resources.milli_vcpu,
      ram_bytes: branch.max_resources.ram_bytes,
      nvme_bytes: branch.max_resources.nvme_bytes,
      iops: branch.max_resources.iops,
      storage_bytes: branch.max_resources.storage_bytes ?? undefined,
    },
    api_keys: {
      anon: branch.api_keys.anon ?? undefined,
      service_role: branch.api_keys.service_role ?? undefined,
    },
  }
}
