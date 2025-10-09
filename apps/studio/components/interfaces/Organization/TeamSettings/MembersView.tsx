import { AlertCircle, CheckCircle, MessageCircleWarning, Users } from 'lucide-react'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
// Removed the actual API imports and replaced with mock data
// import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
// import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProfile } from 'lib/profile'
import { partition } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Loading,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Switch,
  Card,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { StatsCard } from 'components/ui/StatsCard'

export interface MembersViewProps {
  searchString: string
}

// Mock data for organization members
const mockMembers = [
  {
    id: 1,
    user_id: 'user-1',
    primary_email: 'admin@example.com',
    username: 'admin_user',
    full_name: 'Admin User',
    invited_at: null,
    role_ids: [1],
    mfa_enabled: true,
    is_active: true,
    last_active_at: '2024-04-03T09:12:00Z',
  },
  {
    id: 2,
    user_id: 'user-2',
    primary_email: 'developer@example.com',
    username: 'dev_user',
    full_name: 'Developer User',
    invited_at: null,
    role_ids: [2],
    mfa_enabled: false,
    is_active: true,
    last_active_at: '2024-04-01T14:32:00Z',
  },
  {
    id: 3,
    user_id: null,
    primary_email: 'pending@example.com',
    username: null,
    full_name: 'Pending Invite',
    invited_at: '2023-10-15T12:00:00Z',
    role_ids: [3],
    mfa_enabled: false,
    is_active: false,
    last_active_at: null,
  },
]

// Mock data for organization roles
const mockRoles = {
  org_scoped_roles: [
    { id: 1, name: 'Admin' },
    { id: 2, name: 'Developer' },
  ],
  project_scoped_roles: [
    { id: 3, name: 'Viewer' },
    { id: 4, name: 'Editor' },
  ],
}

// Mock implementation of useOrganizationMembersQuery
const useMockOrganizationMembersQuery = () => {
  return {
    data: mockMembers,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: true,
  }
}

// Mock implementation of useOrganizationRolesV2Query
const useMockOrganizationRolesV2Query = () => {
  return {
    data: mockRoles,
    error: null,
    isSuccess: true,
    isError: false,
  }
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()

  // Replace the actual API calls with mock implementations
  const {
    data: members = [],
    error: membersError,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useMockOrganizationMembersQuery()

  const {
    data: roles,
    error: rolesError,
    isSuccess: isSuccessRoles,
    isError: isErrorRoles,
  } = useMockOrganizationRolesV2Query()

  // Mock profile data if needed
  const mockProfile = {
    user_id: 'user-1',
    username: 'admin_user',
    primary_email: 'admin@example.com',
  }

  // Use mock profile if the real one isn't available
  const effectiveProfile = profile || mockProfile

  const filteredMembers = useMemo(() => {
    return !searchString
      ? members
      : members.filter((member) => {
        if (member.invited_at) {
          return member.primary_email?.includes(searchString)
        }
        if (member.user_id) {
          return (
            member.username.includes(searchString) || member.primary_email?.includes(searchString)
          )
        }
        return false
      })
  }, [members, searchString])

  const [memberStatuses, setMemberStatuses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setMemberStatuses((previousStatuses) => {
      const next: Record<string, boolean> = {}
      members.forEach((member) => {
        const key = String(member.id)
        next[key] = previousStatuses[key] ?? Boolean(member.is_active ?? !member.invited_at)
      })
      return next
    })
  }, [members])

  const [[user], otherMembers] = partition(
    filteredMembers,
    (m) => m.user_id === effectiveProfile?.user_id
  )
  const sortedMembers = otherMembers.sort((a, b) =>
    (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
  )

  const userMember = members.find((m) => m.user_id === effectiveProfile?.user_id)
  const orgScopedRoleIds = (roles?.org_scoped_roles ?? []).map((r) => r.id)
  const isOrgScopedRole = orgScopedRoleIds.includes(userMember?.role_ids?.[0] ?? -1)

  const roleNameById = useMemo(() => {
    const lookup: Record<number, string> = {}
    ;(roles?.org_scoped_roles ?? []).forEach((role) => {
      lookup[role.id] = role.name
    })
    ;(roles?.project_scoped_roles ?? []).forEach((role) => {
      lookup[role.id] = role.name
    })
    return lookup
  }, [roles])

  const renderMemberRow = (member: (typeof members)[number]) => {
    const memberKey = String(member.user_id)
    const isCurrentUser = member.user_id === effectiveProfile?.user_id
    const isActive = memberStatuses[memberKey] ?? true
    const rolesForMember = (member.role_ids ?? [])
      .map((id) => roleNameById[id])
      .filter((name): name is string => Boolean(name))

    const toggleStatus = (next: boolean) => {
      setMemberStatuses((previous) => ({ ...previous, [memberKey]: next }))
    }
    //@ts-ignore
    const lastActiveSource = member.last_active_at ?? member.last_sign_in_at ?? member.updated_at ?? member.invited_at
    const lastActiveDisplay = lastActiveSource
      ? new Date(lastActiveSource).toLocaleDateString()
      : '—'

    return (
      <TableRow key={memberKey}>
        <TableCell>
          <div className="flex items-center gap-x-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {member.full_name || member.username || member.primary_email || 'Unknown user'}
              </span>
              {member.primary_email && (
                <span className="text-xs text-foreground-light">{member.primary_email}</span>
              )}
            </div>
            {isCurrentUser && <Badge color="scale">You</Badge>}
          </div>
        </TableCell>
        <TableCell className="w-36">
          <div className="flex items-center gap-x-2">
            <Switch checked={isActive} onCheckedChange={toggleStatus} />
            <span className="text-sm text-foreground-light">{isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-2">
            {rolesForMember.length > 0 ? (
              rolesForMember.map((role) => (
                <Badge key={`${memberKey}-${role}`} variant="default" className="whitespace-nowrap">
                  {role}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-foreground-light">No roles assigned</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right text-sm text-foreground-light">{lastActiveDisplay}</TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {isLoadingMembers && <GenericSkeletonLoader />}

      {isErrorMembers && (
        <AlertError error={membersError} subject="Failed to retrieve organization members" />
      )}

      {isErrorRoles && (
        <AlertError error={rolesError} subject="Failed to retrieve organization roles" />
      )}

      {isSuccessMembers && (
        <div className="rounded w-full overflow-hidden overflow-x-scroll">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-2">
            <StatsCard
              title="Total Users"
              value="5"
              description="+2 from last month"
              icon={<Users size={18} />}
            />
            <StatsCard
              title="Active"
              value="3"
              description="Fully activated users"
              icon={<CheckCircle size={18} />}
            />
            <StatsCard
              title="InActive"
              value="1"
              description="Blocked accounts"
              icon={<MessageCircleWarning size={18} />}
            />

          </div>
          <Card className="p-2">
            <Loading active={!filteredMembers}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="header-user">User</TableHead>
                    <TableHead key="header-status" className="w-36">
                      Status
                    </TableHead>
                    <TableHead key="header-roles">Roles</TableHead>
                    <TableHead key="header-last-active" className="text-right w-40">
                      Last active
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {[
                    ...(isSuccessRoles && isSuccessMembers && !isOrgScopedRole
                      ? [
                        <TableRow key="project-scope-notice">
                          <TableCell colSpan={4} className="!p-0">
                            <Admonition
                              type="note"
                              title="You are currently assigned with project scoped roles in this organization"
                              description="All the members within the organization will not be visible to you"
                              className="m-0 bg-alternative border-0 rounded-none"
                            />
                          </TableCell>
                        </TableRow>,
                      ]
                      : []),

                    ...(!!user ? [renderMemberRow(user)] : []),

                    ...sortedMembers.map((member) => renderMemberRow(member)),

                    ...(searchString.length > 0 && filteredMembers.length === 0
                      ? [
                        <TableRow key="no-results" className="bg-panel-secondary-light">
                          <TableCell colSpan={4}>
                            <div className="flex items-center space-x-3 opacity-75">
                              <AlertCircle size={16} strokeWidth={2} />
                              <p className="text-foreground-light">
                                No users matched the search query "{searchString}"
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>,
                      ]
                      : []),

                    <TableRow key="footer" className="bg-panel-secondary-light">
                      <TableCell colSpan={4}>
                        <p className="text-foreground-light">
                          {searchString ? `${filteredMembers.length} of ` : ''}
                          {members.length || '0'} {members.length == 1 ? 'user' : 'users'}
                        </p>
                      </TableCell>
                    </TableRow>,
                  ]}
                </TableBody>

              </Table>
            </Loading>
          </Card>
        </div>
      )}
    </>
  )
}

export default MembersView