export const tableEditorKeys = {
  tableEditor: (
    orgId: string | undefined,
    projectId: string | undefined,
    branchId: string | undefined,
    id?: number
  ) => ['branches', orgId, projectId, branchId, 'table-editor', id].filter(Boolean),
}
