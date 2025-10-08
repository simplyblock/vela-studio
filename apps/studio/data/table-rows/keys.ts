import type { GetTableRowsArgs } from './table-rows-query'

type TableRowKeyArgs = Omit<GetTableRowsArgs, 'table'> & { table?: { id?: number } }

export const tableRowKeys = {
  tableRows: (
    orgId?: string,
    projectId?: string,
    branchId?: string,
    { table, roleImpersonationState, ...args }: TableRowKeyArgs = {}
  ) =>
    [
      'branches',
      orgId,
      projectId,
      branchId,
      'table-rows',
      table?.id,
      'rows',
      { roleImpersonation: roleImpersonationState?.role, ...args },
    ] as const,
  tableRowsCount: (
    orgId?: string,
    projectId?: string,
    branchId?: string,
    { table, ...args }: TableRowKeyArgs = {}
  ) => ['branches', orgId, projectId, branchId, 'table-rows', table?.id, 'count', args] as const,
  tableRowsAndCount: (orgId?: string, projectId?: string, branchId?: string, tableId?: number) =>
    ['branches', orgId, projectId, branchId, 'table-rows', tableId] as const,
}
