import { components } from './vela-schema'
import { Organization } from '../../types'
import { Project } from '../projects/project-detail-query'
import fs from 'node:fs'
import CryptoJS from 'crypto-js'
import { OrganizationMember } from '../organizations/organization-members-query'

export type VelaOrganization = components['schemas']['Organization']
export type VelaProject = components['schemas']['ProjectPublic']
export type VelaMember = components['schemas']['UserPublic']

const isDocker = fs.existsSync('/.dockerenv')
if (isDocker) console.log('Running in Docker, using fake encrypted connection string')

export function mapOrganization(organization: VelaOrganization): Organization {
  return {
    id: organization.id!,
    name: organization.name!,
    slug: organization.slug!,
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
    ref: project.slug!,
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
