import { noop } from 'lodash'
import { Lock, Unlock } from 'lucide-react'

import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { EditorTablePageLink } from 'data/prefetchers/project.$ref.editor.$id'
import { Badge } from 'ui'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

interface PolicyTableRowHeaderProps {
  table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }
  isLocked: boolean
  onSelectToggleRLS: (table: {
    id: number
    schema: string
    name: string
    rls_enabled: boolean
  }) => void
  onSelectCreatePolicy: () => void
}

const PolicyTableRowHeader = ({
  table,
  isLocked,
  onSelectToggleRLS = noop,
  onSelectCreatePolicy,
}: PolicyTableRowHeaderProps) => {
  const { slug: orgRef, ref: projectRef, branch: branchRef } = useParams() as { slug: string; ref: string, branch: string }
  const { can: canCreatePolicies } = useCheckPermissions("branch:rls:admin")
  const { can: canToggleRLS } = useCheckPermissions("branch:rls:admin")

  const isRealtimeSchema = table.schema === 'realtime'
  const isRealtimeMessagesTable = isRealtimeSchema && table.name === 'messages'
  const isTableLocked = isRealtimeSchema ? !isRealtimeMessagesTable : isLocked

  return (
    <div id={table.id.toString()} className="flex w-full items-center justify-between">
      <div className="flex gap-x-4 text-left">
        <EditorTablePageLink
          orgRef={orgRef}
          projectRef={projectRef}
          branchRef={branchRef}
          id={String(table.id)}
          className="flex items-center gap-x-2"
        >
          {table.rls_enabled ? (
            <div className="flex items-center gap-x-1 text-xs">
              <Lock size={14} strokeWidth={2} className="text-brand" />
            </div>
          ) : (
            <div className="flex items-center gap-x-1 text-xs">
              <Unlock size={14} strokeWidth={2} className="text-warning-600" />
            </div>
          )}
          <h4 className="m-0">{table.name}</h4>
        </EditorTablePageLink>
        <div className="flex items-center gap-x-2">
          {isTableLocked && (
            <Badge>
              <span className="flex gap-2 items-center text-xs uppercase text-foreground-lighter">
                <Lock size={12} /> Locked
              </span>
            </Badge>
          )}
        </div>
      </div>
      {!isTableLocked && (
        <div className="flex-1">
          <div className="flex flex-row justify-end gap-x-2">
            {!isRealtimeMessagesTable && (
              <ButtonTooltip
                type="default"
                disabled={!canToggleRLS}
                onClick={() => onSelectToggleRLS(table)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: !canToggleRLS
                      ? 'You need additional permissions to toggle RLS'
                      : undefined,
                  },
                }}
              >
                {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
              </ButtonTooltip>
            )}
            <ButtonTooltip
              type="default"
              disabled={!canToggleRLS || !canCreatePolicies}
              onClick={() => onSelectCreatePolicy()}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canToggleRLS
                    ? !canToggleRLS || !canCreatePolicies
                      ? 'You need additional permissions to create RLS policies'
                      : undefined
                    : undefined,
                },
              }}
            >
              Create policy
            </ButtonTooltip>
          </div>
        </div>
      )}
    </div>
  )
}

export default PolicyTableRowHeader
