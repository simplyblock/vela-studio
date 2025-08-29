import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  HelpCircle,
  MessageCircleWarning,
  Users,
} from 'lucide-react'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
// Removed the actual API imports and replaced with mock data
// import { useOrganizationRolesV2Query } from 'data/organization-members/organization-roles-query'
// import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useProfile } from 'lib/profile'
import { partition } from 'lodash'
import { useMemo } from 'react'
import {
  Button,
  Loading,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  Card,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { MemberRow } from './MemberRow'
import { StatsCard } from 'components/ui/StatsCard'

export interface MembersViewProps {
  searchString: string
}

// Mock data for organization members
const mockMembers = [
  {
    id: 1,
    gotrue_id: 'user-1',
    primary_email: 'admin@example.com',
    username: 'admin_user',
    invited_at: null,
    role_ids: [1],
    mfa_enabled: true,
  },
  {
    id: 2,
    gotrue_id: 'user-2',
    primary_email: 'developer@example.com',
    username: 'dev_user',
    invited_at: null,
    role_ids: [2],
    mfa_enabled: false,
  },
  {
    id: 3,
    gotrue_id: null,
    primary_email: 'pending@example.com',
    username: null,
    invited_at: '2023-10-15T12:00:00Z',
    role_ids: [3],
    mfa_enabled: false,
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
    gotrue_id: 'user-1',
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
          if (member.gotrue_id) {
            return (
              member.username.includes(searchString) || member.primary_email?.includes(searchString)
            )
          }
          return false
        })
  }, [members, searchString])

  const [[user], otherMembers] = partition(
    filteredMembers,
    (m) => m.gotrue_id === effectiveProfile?.gotrue_id
  )
  const sortedMembers = otherMembers.sort((a, b) =>
    (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
  )

  const userMember = members.find((m) => m.gotrue_id === effectiveProfile?.gotrue_id)
  const orgScopedRoleIds = (roles?.org_scoped_roles ?? []).map((r) => r.id)
  const isOrgScopedRole = orgScopedRoleIds.includes(userMember?.role_ids?.[0] ?? -1)

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
              title="Activated"
              value="3"
              description="Fully activated users"
              icon={<CheckCircle size={18} />}
            />
            <StatsCard
              title="Pending"
              value="1"
              description="Awaiting activation"
              icon={<Clock size={18} />}
            />
            <StatsCard
              title="Blocked"
              value="1"
              description="Blocked accounts"
              icon={<MessageCircleWarning size={18} />}
            />
            <StatsCard
              title="Avg. Roles"
              value="1"
              description="Per user"
              icon={<Calendar size={18} />}
            />
          </div>
          <Card className="p-2">
            <Loading active={!filteredMembers}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="header-user">User</TableHead>
                    <TableHead key="header-status" className="w-24" />
                    <TableHead key="header-mfa" className="text-center w-32">
                      Enabled MFA
                    </TableHead>
                    <TableHead key="header-role" className="flex items-center space-x-1">
                      <span>Role</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild type="text" className="px-1">
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href="https://supabase.com/docs/guides/platform/access-control"
                            >
                              <HelpCircle size={14} className="text-foreground-light" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          How to configure access control?
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead key="header-action" />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {[
                    ...(isSuccessRoles && isSuccessMembers && !isOrgScopedRole
                      ? [
                          <TableRow key="project-scope-notice">
                            <TableCell colSpan={12} className="!p-0">
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
                    // @ts-ignore
                    ...(!!user ? [<MemberRow key={user.gotrue_id} member={user} />] : []),

                    ...sortedMembers.map((member) => (
                      // @ts-ignore
                      <MemberRow key={member.gotrue_id || member.id} member={member} />
                    )),
                    ...(searchString.length > 0 && filteredMembers.length === 0
                      ? [
                          <TableRow key="no-results" className="bg-panel-secondary-light">
                            <TableCell colSpan={12}>
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
                      <TableCell colSpan={12}>
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
