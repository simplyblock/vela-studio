import { components } from './vela-schema'
import { Organization } from '../../types'
import { Member } from '../organizations/organization-members-query'
import { Branch } from '../branches/branch-query'
import { isDocker } from '../../lib/docker'

const isInDocker = isDocker()

export type VelaOrganization = components['schemas']['Organization']
export type VelaMember = components['schemas']['UserPublic']
export type VelaBranch = components['schemas']['BranchPublic']

export function mapOrganization(organization: VelaOrganization): Organization {
  return {
    id: organization.id!,
    name: organization.name!,
    env_types: organization.environments.split(',').filter((env) => env !== ''),
    max_backups: organization.max_backups,
    require_mfa: organization.require_mfa,
  }
}

export function mapOrganizationMember(member: VelaMember): Member {
  return {
    user_id: member.id,
    username: member.email,
    email: member.email,
    primary_email: member.email,
    mfa_enabled: member.mfa_enabled,
    is_sso_user: true,
    active: member.active,
    email_verified: member.email_verified,
    last_activity_at: member.last_activity_at ?? undefined,
    role_ids: [],
    metadata: {
      first_name: member.first_name,
      last_name: member.last_name,
    },
  }
}

export function mapBranch(branch: VelaBranch): Branch {
  if (isInDocker) {
    branch.database.service_endpoint_uri = 'http://localhost:8000'
    branch.api_keys.service_role=process.env.SUPABASE_SERVICE_KEY!
    branch.api_keys.anon=process.env.SUPABASE_ANON_KEY!
    console.log(branch.api_keys)
  }
  return branch
}
