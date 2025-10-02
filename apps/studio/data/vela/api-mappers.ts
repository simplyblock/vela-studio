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
  let encryptedConnectionString = project.encrypted_database_connection_string!
  if (isDocker) {
    encryptedConnectionString = CryptoJS.AES.encrypt(
      'postgresql://supabase_admin:your-super-secret-and-long-postgres-password@db:5432/postgres', 'SAMPLE_KEY'
    ).toString().trim() // FIXME: Encrypted connectionString needs to come from the outside
  }

  return {
    id: project.id!,
    name: project.name!,
    ref: project.id!,
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
    connectionString: encryptedConnectionString,
    default_branch: 'main'
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
      last_name: member.last_name
    }
  }
}

export function mapProjectBranch(branch: VelaBranch, organizationId: string, projectId: string): Branch {
  return {
    id: branch.id,
    created_at: '2022-01-01T00:00:00Z',
    created_by: 'me',
    name: branch.name,
    project_id: projectId,
    organization_id: organizationId,
    status: {
      database: 'ACTIVE_HEALTHY',
      realtime: 'STOPPED',
      storage: 'STOPPED',
    },
    database: {} as any,
    pitr_enabled: true,
    assigned_labels: [],
    used_resources: {
      vcpu: 0,
      ram_bytes: 0,
      nvme_bytes: 0,
      iops: 0,
      storage_bytes: undefined,
    },
    max_resources: {
      vcpu: 0,
      ram_bytes: 0,
      nvme_bytes: 0,
      iops: 0,
      storage_bytes: undefined,
    },
    api_keys: {
      anon: '',
      service_role: '',
    },
  }
}
