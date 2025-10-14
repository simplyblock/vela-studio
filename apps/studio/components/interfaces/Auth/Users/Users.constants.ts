export const PANEL_PADDING = 'px-5 py-5'

// [Joshen] Temporary fix as bulk delete will fire n requests since Auth + API do not have a bulk delete endpoint yet
export const MAX_BULK_DELETE = 20

export type UsersTableColumn = {
  id: string
  name: string
  minWidth?: number
  width?: number
  resizable?: boolean
}
export type ColumnConfiguration = { id: string; width?: number }
export const USERS_TABLE_COLUMNS: UsersTableColumn[] = [
  { id: 'img', name: '', minWidth: 95, width: 95, resizable: false },
  { id: 'id', name: 'UID', width: 280 },
  { id: 'name', name: 'Display name', minWidth: 0, width: 150 },
  { id: 'email', name: 'Email', width: 300 },
  { id: 'created_at', name: 'Created at', width: 260 },
]
