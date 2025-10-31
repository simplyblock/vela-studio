import { components } from './vela-schema'
import { Organization } from '../../types'
import { OrganizationMember } from '../organizations/organization-members-query'

export type VelaOrganization = components['schemas']['Organization']
export type VelaMember = components['schemas']['UserPublic']

export function mapOrganization(organization: VelaOrganization): Organization {
  return {
    id: organization.id!,
    name: organization.name!,
    env_types: organization.environments.split(',').filter((env) => env !== ''),
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
