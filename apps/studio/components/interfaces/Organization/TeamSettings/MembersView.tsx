import { AlertCircle, CheckCircle, MessageCircleWarning, Users } from 'lucide-react'
import { useParams } from 'common'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProfile } from 'lib/profile'
import { partition } from 'lodash'
import { useMemo } from 'react'
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
import { StatsCard } from 'components/ui/StatsCard'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useOrganizationRolesQuery } from 'data/organizations/organization-roles-query'

export interface MembersViewProps {
  searchString: string
}

const MembersView = ({ searchString }: MembersViewProps) => {
  const { slug } = useParams()
  const { profile } = useProfile()

  const {
    data: members = [],
    error: membersError,
    isLoading: isLoadingMembers,
    isError: isErrorMembers,
    isSuccess: isSuccessMembers,
  } = useOrganizationMembersQuery({ slug })

  const {
    data: roles,
    error: rolesError,
    isError: isErrorRoles,
  } = useOrganizationRolesQuery({ slug })

  // Use profile if available, otherwise fall back to a minimal placeholder
  const effectiveProfile =
    profile || {
      user_id: '',
      username: '',
      primary_email: '',
    }

  const membersData = members
  const rolesData = roles ?? []

  const filteredMembers = useMemo(() => {
    return !searchString
      ? membersData
      : membersData.filter((member) => {
          if ((member as any).invited_at) {
            return member.primary_email?.includes(searchString)
          }
          if (member.user_id) {
            return (
              member.username.includes(searchString) || member.primary_email?.includes(searchString)
            )
          }
          return false
        })
  }, [membersData, searchString])

  const [[user], otherMembers] = partition(
    filteredMembers,
    (m) => m.user_id === effectiveProfile?.user_id
  )
  const sortedMembers = otherMembers.sort((a, b) =>
    (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
  )

  const roleNameById = useMemo(() => {
    const lookup: Record<string, string> = {}
    rolesData.forEach((role) => {
      lookup[role.id] = role.name
    })
    return lookup
  }, [rolesData])

  const renderMemberRow = (member: (typeof membersData)[number]) => {
    const memberKey = String(member.user_id)
    const isCurrentUser = member.user_id === effectiveProfile?.user_id
    const invitedAt = (member as any).invited_at as string | undefined
    const isActive = Boolean(member.active ?? !invitedAt)

    const rolesForMember = (member.role_ids ?? [])
      .map((id) => roleNameById[id])
      .filter((name): name is string => Boolean(name))

    const lastActiveSource = member.last_activity_at
    const lastActiveDisplay = lastActiveSource
      ? new Date(lastActiveSource).toLocaleDateString()
      : '—'

    return (
      <TableRow key={memberKey}>
        <TableCell>
          <div className="flex items-center gap-x-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {member.username || member.primary_email || 'Unknown user'}
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
            {/* Read-only status: no onCheckedChange */}
            <Switch checked={isActive} disabled />
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

  // ----- Stats derived from data (based on underlying active flag) -----

  const totalUsers = membersData.length

  const activeUsers = membersData.reduce((count, member) => {
    const invitedAt = (member as any).invited_at as string | undefined
    const isActive = Boolean(member.active ?? !invitedAt)
    return count + (isActive ? 1 : 0)
  }, 0)

  const inactiveUsers = totalUsers - activeUsers

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
              value={String(totalUsers)}
              description="total users in the system"
              icon={<Users size={18} />}
            />
            <StatsCard
              title="Active"
              value={String(activeUsers)}
              description="active accounts"
              icon={<CheckCircle size={18} />}
            />
            <StatsCard
              title="InActive"
              value={String(inactiveUsers)}
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
                          {membersData.length || '0'} {membersData.length == 1 ? 'user' : 'users'}
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
