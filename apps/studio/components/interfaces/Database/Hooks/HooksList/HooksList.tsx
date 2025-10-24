import { PostgresTrigger } from '@supabase/postgres-meta'
import { includes, map as lodashMap, uniqBy } from 'lodash'
import { Search } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DocsButton } from 'components/ui/DocsButton'
import NoSearchResults from 'components/ui/NoSearchResults'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useDatabaseHooksQuery } from 'data/database-triggers/database-triggers-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { noop } from 'lib/void'
import { Input } from 'ui'
import { HooksListEmpty } from './HooksListEmpty'
import { SchemaTable } from './SchemaTable'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export interface HooksListProps {
  createHook: () => void
  editHook: (hook: PostgresTrigger) => void
  deleteHook: (hook: PostgresTrigger) => void
}

export const HooksList = ({
  createHook = noop,
  editHook = noop,
  deleteHook = noop,
}: HooksListProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: branch } = useSelectedBranchQuery()
  const {
    data: hooks,
    isLoading,
    isSuccess,
    isError,
    error,
  } = useDatabaseHooksQuery({
    branch
  })
  const [filterString, setFilterString] = useState<string>('')

  const filteredHooks = (hooks || []).filter((x: any) =>
    includes(x.name.toLowerCase(), filterString.toLowerCase())
  )
  const filteredHookSchemas = lodashMap(uniqBy(filteredHooks, 'schema'), 'schema')
  const { can: canCreateWebhooks, isLoading: isPermissionsLoading } = useCheckPermissions("branch:settings:admin")

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search for a webhook"
          size="tiny"
          icon={<Search size="14" />}
          value={filterString}
          className="w-52"
          onChange={(e) => setFilterString(e.target.value)}
        />
        <div className="flex items-center gap-x-2">
          <DocsButton href="https://supabase.com/docs/guides/database/webhooks" />
          <ButtonTooltip
            onClick={() => createHook()}
            disabled={isPermissionsLoading || !canCreateWebhooks}
            tooltip={{
              content: {
                side: 'bottom',
                text:
                  !isPermissionsLoading && !canCreateWebhooks
                    ? 'You need additional permissions to create webhooks'
                    : undefined,
              },
            }}
          >
            Create a new hook
          </ButtonTooltip>
        </div>
      </div>

      {isLoading && (
        <div className="py-4">
          <GenericSkeletonLoader />
        </div>
      )}

      {isError && <AlertError error={error} subject="Failed to retrieve database webhooks" />}

      {isSuccess &&
        (hooks.length <= 0 ? (
          <HooksListEmpty />
        ) : (
          <>
            {filteredHooks.length <= 0 && (
              <NoSearchResults
                searchString={filterString}
                onResetFilter={() => setFilterString('')}
              />
            )}
            {filteredHookSchemas.map((schema: any) => (
              <SchemaTable
                key={schema}
                filterString={filterString}
                schema={schema}
                editHook={editHook}
                deleteHook={deleteHook}
              />
            ))}
          </>
        ))}
    </div>
  )
}
