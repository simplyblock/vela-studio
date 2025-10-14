import dayjs from 'dayjs'
import { Clipboard, Trash, UserIcon } from 'lucide-react'
import { Column, useRowSelection } from 'react-data-grid'

import { User } from 'data/auth/users-infinite-query'
import {
  Checkbox_Shadcn_,
  cn,
  ContextMenu_Shadcn_,
  ContextMenuContent_Shadcn_,
  ContextMenuItem_Shadcn_,
  ContextMenuSeparator_Shadcn_,
  ContextMenuTrigger_Shadcn_,
  copyToClipboard,
} from 'ui'
import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import { ColumnConfiguration, USERS_TABLE_COLUMNS } from './Users.constants'
import { HeaderCell } from './UsersGridComponents'

export const formatUsersData = (users: User[]) => {
  return users.map((user) => {
    return {
      id: user.id,
      email: user.email,
      created_at: user.createdTimestamp,
      name: getDisplayName(user),
    }
  })
}

function toPrettyJsonString(value: unknown): string | undefined {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map((item) => toPrettyJsonString(item)).join(' ')

  try {
    return JSON.stringify(value)
  } catch (error) {
    // ignore the error
  }

  return undefined
}

export function getDisplayName(user: User, fallback = '-'): string {
  if (typeof user.firstName === 'undefined' && typeof user.lastName === 'undefined') return fallback
  if (typeof user.firstName === 'undefined' && typeof user.lastName !== 'undefined')
    return user.lastName || fallback
  if (typeof user.lastName === 'undefined' && typeof user.firstName !== 'undefined')
    return user.firstName || fallback
  return toPrettyJsonString(`${user.firstName} ${user.lastName}`) || fallback
}

export function getAvatarUrl(user: User): string | undefined {
  return undefined
}

export const formatUserColumns = ({
  config,
  users,
  visibleColumns = [],
  setSortByValue,
  onSelectDeleteUser,
}: {
  config: ColumnConfiguration[]
  users: User[]
  visibleColumns?: string[]
  setSortByValue: (val: string) => void
  onSelectDeleteUser: (user: User) => void
}) => {
  const columnOrder = config.map((c) => c.id) ?? USERS_TABLE_COLUMNS.map((c) => c.id)

  let gridColumns = USERS_TABLE_COLUMNS.map((col) => {
    const savedConfig = config.find((c) => c.id === col.id)
    const res: Column<any> = {
      key: col.id,
      name: col.name,
      resizable: col.resizable ?? true,
      sortable: false,
      draggable: true,
      width: savedConfig?.width ?? col.width,
      minWidth: col.minWidth ?? 120,
      headerCellClass: 'z-50 outline-none !shadow-none',
      renderHeaderCell: () => {
        // [Joshen] I'm on the fence to support "Select all" for users, as the results are infinitely paginated
        // "Select all" wouldn't be an accurate representation if not all the pages have been fetched, but if decide
        // to support - the component is ready as such: Just pass selectedUsers and allRowsSelected as props from parent
        // <SelectHeaderCell selectedUsers={selectedUsers} allRowsSelected={allRowsSelected} />
        if (col.id === 'img') return undefined
        return <HeaderCell col={col} setSortByValue={setSortByValue} />
      },
      renderCell: ({ row }) => {
        // This is actually a valid React component, so we can use hooks here
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [isRowSelected, onRowSelectionChange] = useRowSelection()

        const value = row?.[col.id]
        const user = users?.find((u) => u.id === row.id)
        const formattedValue =
          value !== null && ['created_at', 'last_sign_in_at'].includes(col.id)
            ? dayjs(value).format('ddd DD MMM YYYY HH:mm:ss [GMT]ZZ')
            : Array.isArray(value)
              ? col.id === 'providers'
                ? value
                    .map((x) => {
                      const meta = PROVIDERS_SCHEMAS.find(
                        (y) => ('key' in y && y.key === x) || y.title.toLowerCase() === x
                      )
                      return meta?.title
                    })
                    .join(', ')
                : value.join(', ')
              : value
        const isConfirmed = user?.emailVerified

        if (col.id === 'img') {
          return (
            <div className="flex items-center justify-center gap-x-2">
              <Checkbox_Shadcn_
                checked={isRowSelected}
                onClick={(e) => {
                  e.stopPropagation()
                  onRowSelectionChange({
                    row,
                    type: 'ROW',
                    checked: !isRowSelected,
                    isShiftClick: e.shiftKey,
                  })
                }}
              />
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full bg-center bg-cover bg-no-repeat',
                  !row.img ? 'bg-selection' : 'border'
                )}
                style={{ backgroundImage: row.img ? `url('${row.img}')` : 'none' }}
              >
                {!row.img && <UserIcon size={12} />}
              </div>
            </div>
          )
        }

        return (
          <ContextMenu_Shadcn_>
            <ContextMenuTrigger_Shadcn_ asChild>
              <div
                className={cn(
                  'w-full flex items-center text-xs',
                  col.id.includes('provider') ? 'capitalize' : ''
                )}
              >
                {/* [Joshen] Not convinced this is the ideal way to display the icons, but for now */}
                {col.id === 'providers' &&
                  row.provider_icons?.map((icon: string, idx: number) => {
                    const provider = row.providers[idx]
                    return (
                      <div
                        className="min-w-6 min-h-6 rounded-full border flex items-center justify-center bg-surface-75"
                        style={{
                          marginLeft: idx === 0 ? 0 : `-8px`,
                          zIndex: row.provider_icons.length - idx,
                        }}
                      >
                        <img
                          key={`${user?.id}-${provider}`}
                          width={16}
                          src={icon}
                          alt={`${provider} auth icon`}
                          className={cn(provider === 'github' && 'dark:invert')}
                        />
                      </div>
                    )
                  })}
                {col.id === 'last_sign_in_at' && !isConfirmed ? (
                  <p className="text-foreground-lighter">Waiting for verification</p>
                ) : (
                  <p className={cn(col.id === 'providers' && 'ml-1')}>
                    {formattedValue === null ? '-' : formattedValue}
                  </p>
                )}
              </div>
            </ContextMenuTrigger_Shadcn_>
            <ContextMenuContent_Shadcn_ onClick={(e) => e.stopPropagation()}>
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onFocusCapture={(e) => e.stopPropagation()}
                onSelect={() => {
                  const value = col.id === 'providers' ? row.providers.join(', ') : formattedValue
                  copyToClipboard(value)
                }}
              >
                <Clipboard size={12} />
                <span>Copy {col.id === 'id' ? col.name : col.name.toLowerCase()}</span>
              </ContextMenuItem_Shadcn_>
              <ContextMenuSeparator_Shadcn_ />
              <ContextMenuItem_Shadcn_
                className="gap-x-2"
                onFocusCapture={(e) => e.stopPropagation()}
                onSelect={() => {
                  if (user) onSelectDeleteUser(user)
                }}
              >
                <Trash size={12} />
                <span>Delete user</span>
              </ContextMenuItem_Shadcn_>
            </ContextMenuContent_Shadcn_>
          </ContextMenu_Shadcn_>
        )
      },
    }
    return res
  })

  const profileImageColumn = gridColumns.find((col) => col.key === 'img')

  if (columnOrder.length > 0) {
    gridColumns = gridColumns
      .filter((col) => columnOrder.includes(col.key))
      .sort((a: any, b: any) => {
        return columnOrder.indexOf(a.key) - columnOrder.indexOf(b.key)
      })
  }

  return visibleColumns.length === 0
    ? gridColumns
    : ([profileImageColumn].concat(
        gridColumns.filter((col) => visibleColumns.includes(col.key))
      ) as Column<any>[])
}
