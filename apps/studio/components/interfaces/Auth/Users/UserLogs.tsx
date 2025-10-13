import { ExternalLink, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { User } from 'data/auth/users-infinite-query'
import { useLogsQuery } from 'data/auth/logs-query'
import { Button, cn, CriticalIcon, Separator } from 'ui'
import { Admonition, TimestampInfo } from 'ui-patterns'
import { UserHeader } from './UserHeader'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { PANEL_PADDING } from './Users.constants'

interface UserLogsProps {
  user: User
}

export const UserLogs = ({ user }: UserLogsProps) => {
  const { slug: orgId, ref: projectId, branch: branchId } = useParams()
  const { data: branch } = useSelectedBranchQuery()
  const [showErrorsOnly, setShowErrorsOnly] = useState(false)

  const {
    data: authLogs,
    isSuccess: isSuccessAuthLogs,
    isLoading: isLoadingAuthLogs,
    refetch,
  } = useLogsQuery({
    branch,
    filter: {
      user: user.id,
      dateFrom: Date.now() - (60 * 60 * 1000),
    }
  })

  const filteredLogs = useMemo(() => {
    if (!authLogs) return []
    if (!showErrorsOnly) return authLogs
    return authLogs.filter(log => log.error !== undefined)
  }, [authLogs, showErrorsOnly])

  return (
    <div>
      <UserHeader user={user} />

      <Separator />

      <div className={cn('flex flex-col gap-y-3', PANEL_PADDING)}>
        <div>
          <p>Authentication logs</p>
          <p className="text-sm text-foreground-light">
            Latest logs from authentication for this user in the past hour
          </p>
        </div>

        {/* [Joshen] This whole thing here i reckon we can shift to a component, if in the future we wanna add more user logs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              type={!showErrorsOnly ? 'default' : 'secondary'}
              className="rounded-r-none border-r-0"
              disabled={isLoadingAuthLogs}
              onClick={() => setShowErrorsOnly(false)}
            >
              Show all
            </Button>
            <div className="border-button border border-l-0 py-3" />
            <Button
              type={showErrorsOnly ? 'default' : 'secondary'}
              className="rounded-l-none border-l-0"
              disabled={isLoadingAuthLogs}
              onClick={() => setShowErrorsOnly(true)}
            >
              Error only
            </Button>
          </div>
          <Button
            type="default"
            loading={isLoadingAuthLogs}
            disabled={isLoadingAuthLogs}
            icon={<RefreshCw />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>

        {isLoadingAuthLogs && !isSuccessAuthLogs ? (
          <GenericSkeletonLoader />
        ) : filteredLogs?.length === 0 ? (
          <Admonition
            type="note"
            title="No recent authentication logs available for this user"
            description="Auth events such as logging in will be shown here"
          />
        ) : (
          <div>
            <div className="border border-b-0 rounded-t-md divide-y overflow-hidden">
              {filteredLogs?.map((log) => {
                return (
                  <div
                    key={log.id}
                    className="flex items-center transition font-mono px-2 py-1.5 bg-surface-100 divide-x"
                  >
                    <p className="text-xs text-foreground-light min-w-[125px] w-[125px] px-1">
                      <TimestampInfo utcTimestamp={log.time!} />
                    </p>
                    <div className="flex items-center text-xs text-foreground-light h-[22px] min-w-[70px] w-[70px] px-2">
                      <div
                        className={cn(
                          'flex items-center justify-center gap-x-1',
                          'border px-1 py-0.5 rounded',
                          (log.error !== undefined)
                            ? 'text-warning border-warning bg-warning-300'
                            : ''
                        )}
                      >
                        {(log.error !== undefined) && (
                          <CriticalIcon
                            hideBackground
                            className={cn('text-warning-600')}
                          />
                        )}
                        {status}
                      </div>
                    </div>
                    <p className="group relative flex items-center py-1.5 text-xs text-foreground-light px-2 truncate w-full">
                      {`${log.type}`}

                      <ButtonTooltip
                        type="outline"
                        asChild
                        tooltip={{ content: { text: 'Open in logs' } }}
                        className="px-1.5 absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition bg-background focus-visible:opacity-100"
                      >
                        <Link href={`/org/${orgId}/project/${projectId}/branch/${branchId}/logs/auth-logs?log=${log.id}`}>
                          <ExternalLink size="12" className="text-foreground-light" />
                        </Link>
                      </ButtonTooltip>
                    </p>
                  </div>
                )
              })}
            </div>
            <Button
              block
              asChild
              type="outline"
              className="transition rounded-t-none text-foreground-light hover:text-foreground"
            >
              <Link href={`/org/${orgId}/project/${projectId}/branch/${branchId}/logs/auth-logs?s=${user.id}`}>See more logs</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
