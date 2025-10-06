import type { PostgresPrimaryKey } from '@supabase/postgres-meta'
import { chunk, find, isEmpty, isEqual } from 'lodash'
import Papa from 'papaparse'
import { toast } from 'sonner'

import { Query } from '@supabase/pg-meta/src/query'
import SparkBar from 'components/ui/SparkBar'
import { createDatabaseColumn } from 'data/database-columns/database-column-create-mutation'
import { deleteDatabaseColumn } from 'data/database-columns/database-column-delete-mutation'
import { updateDatabaseColumn } from 'data/database-columns/database-column-update-mutation'
import type { Constraint } from 'data/database/constraints-query'
import { FOREIGN_KEY_CASCADE_ACTION } from 'data/database/database-query-constants'
import { ForeignKeyConstraint } from 'data/database/foreign-key-constraints-query'
import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { prefetchEditorTablePage } from 'data/prefetchers/project.$ref.editor.$id'
import { getQueryClient } from 'data/query-client'
import { executeSql } from 'data/sql/execute-sql-query'
import { tableEditorKeys } from 'data/table-editor/keys'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { tableRowKeys } from 'data/table-rows/keys'
import { tableKeys } from 'data/tables/keys'
import { createTable as createTableMutation } from 'data/tables/table-create-mutation'
import { deleteTable as deleteTableMutation } from 'data/tables/table-delete-mutation'
import {
  getTable,
  RetrievedTableColumn,
  RetrieveTableResult,
} from 'data/tables/table-retrieve-query'
import {
  updateTable as updateTableMutation,
  UpdateTableBody,
} from 'data/tables/table-update-mutation'
import { getTables } from 'data/tables/tables-query'
import { timeout, tryParseJson } from 'lib/helpers'
import {
  generateCreateColumnPayload,
  generateUpdateColumnPayload,
} from './ColumnEditor/ColumnEditor.utils'
import type { ForeignKey } from './ForeignKeySelector/ForeignKeySelector.types'
import type { ColumnField, CreateColumnPayload, UpdateColumnPayload } from './SidePanelEditor.types'
import { checkIfRelationChanged } from './TableEditor/ForeignKeysManagement/ForeignKeysManagement.utils'
import type { ImportContent } from './TableEditor/TableEditor.types'
import { Branch } from 'api-types/types'

const BATCH_SIZE = 1000
const CHUNK_SIZE = 1024 * 1024 * 0.1 // 0.1MB

/**
 * The functions below are basically just queries but may be supported directly
 * from the pg-meta library in the future
 */
export const addPrimaryKey = async (
  branch: Branch,
  schema: string,
  table: string,
  columns: string[]
) => {
  const primaryKeyColumns = columns.join('","')
  const query = `ALTER TABLE "${schema}"."${table}" ADD PRIMARY KEY ("${primaryKeyColumns}")`
  return await executeSql({
    branch,
    sql: query,
    queryKey: ['primary-keys'],
  })
}

export const dropConstraint = async (
  branch: Branch,
  schema: string,
  table: string,
  name: string
) => {
  const query = `ALTER TABLE "${schema}"."${table}" DROP CONSTRAINT "${name}"`
  return await executeSql({
    branch,
    sql: query,
    queryKey: ['drop-constraint'],
  })
}

export const getAddForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const getOnDeleteSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON DELETE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON DELETE RESTRICT'
        : action === FOREIGN_KEY_CASCADE_ACTION.SET_DEFAULT
          ? 'ON DELETE SET DEFAULT'
          : action === FOREIGN_KEY_CASCADE_ACTION.SET_NULL
            ? 'ON DELETE SET NULL'
            : ''
  const getOnUpdateSql = (action: string) =>
    action === FOREIGN_KEY_CASCADE_ACTION.CASCADE
      ? 'ON UPDATE CASCADE'
      : action === FOREIGN_KEY_CASCADE_ACTION.RESTRICT
        ? 'ON UPDATE RESTRICT'
        : ''
  return (
    foreignKeys
      .map((relation) => {
        const { deletionAction, updateAction } = relation
        const onDeleteSql = getOnDeleteSql(deletionAction)
        const onUpdateSql = getOnUpdateSql(updateAction)
        return `
      ALTER TABLE "${table.schema}"."${table.name}"
      ADD FOREIGN KEY (${relation.columns.map((column) => `"${column.source}"`).join(',')})
      REFERENCES "${relation.schema}"."${relation.table}" (${relation.columns.map((column) => `"${column.target}"`).join(',')})
      ${onUpdateSql}
      ${onDeleteSql}
    `
          .replace(/\s+/g, ' ')
          .trim()
      })
      .join(';') + ';'
  )
}

export const addForeignKey = async ({
  branch,
  table,
  foreignKeys,
}: {
  branch: Branch
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = getAddForeignKeySQL({ table, foreignKeys })
  return await executeSql({
    branch,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

export const getRemoveForeignKeySQL = ({
  table,
  foreignKeys,
}: {
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  return (
    foreignKeys
      .map((relation) =>
        `
ALTER TABLE IF EXISTS "${table.schema}"."${table.name}"
DROP CONSTRAINT IF EXISTS "${relation.name}"
`
          .replace(/\s+/g, ' ')
          .trim()
      )
      .join(';') + ';'
  )
}

export const removeForeignKey = async ({
  branch,
  table,
  foreignKeys,
}: {
  branch: Branch
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = getRemoveForeignKeySQL({ table, foreignKeys })
  return await executeSql({
    branch,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

export const updateForeignKey = async ({
  branch,
  table,
  foreignKeys,
}: {
  branch: Branch
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
}) => {
  const query = `
  ${getRemoveForeignKeySQL({ table, foreignKeys })}
  ${getAddForeignKeySQL({ table, foreignKeys })}
  `
    .replace(/\s+/g, ' ')
    .trim()
  return await executeSql({
    branch,
    sql: query,
    queryKey: ['foreign-keys'],
  })
}

/**
 * The methods below involve several contexts due to the UI flow of the
 * dashboard and hence do not sit within their own stores
 */
export const createColumn = async ({
  branch,
  payload,
  selectedTable,
  primaryKey,
  foreignKeyRelations = [],
  skipSuccessMessage = false,
  toastId: _toastId,
}: {
  branch: Branch
  payload: CreateColumnPayload
  selectedTable: RetrieveTableResult
  primaryKey?: Constraint
  foreignKeyRelations?: ForeignKey[]
  skipSuccessMessage?: boolean
  toastId?: string | number
}) => {
  const toastId = _toastId ?? toast.loading(`Creating column "${payload.name}"...`)
  try {
    // Once pg-meta supports composite keys, we can remove this logic
    const { isPrimaryKey, ...formattedPayload } = payload
    await createDatabaseColumn({
      branch,
      payload: formattedPayload,
    })

    // Firing createColumn in createTable will bypass this block
    if (isPrimaryKey) {
      toast.loading('Assigning primary key to column...', { id: toastId })
      // Same logic in createTable: Remove any primary key constraints first (we'll add it back later)
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        await dropConstraint(branch, payload.schema, payload.table, primaryKey.name)
      }

      const primaryKeyColumns = existingPrimaryKeys.concat([formattedPayload.name])
      await addPrimaryKey(branch, payload.schema, payload.table, primaryKeyColumns)
    }

    // Then add the foreign key constraints here
    if (foreignKeyRelations.length > 0) {
      await addForeignKey({
        branch,
        table: { schema: payload.schema, name: payload.table },
        foreignKeys: foreignKeyRelations,
      })
    }

    if (!skipSuccessMessage) {
      toast.success(`Successfully created column "${formattedPayload.name}"`, { id: toastId })
    }
    return { error: undefined }
  } catch (error: any) {
    toast.error(`An error occurred while creating the column "${payload.name}"`, { id: toastId })
    return { error }
  }
}

export const updateColumn = async ({
  branch,
  originalColumn,
  payload,
  selectedTable,
  primaryKey,
  foreignKeyRelations = [],
  existingForeignKeyRelations = [],
  skipPKCreation,
  skipSuccessMessage = false,
}: {
  branch: Branch
  originalColumn: RetrievedTableColumn
  payload: UpdateColumnPayload
  selectedTable: RetrieveTableResult
  primaryKey?: Constraint
  foreignKeyRelations?: ForeignKey[]
  existingForeignKeyRelations?: ForeignKeyConstraint[]
  skipPKCreation?: boolean
  skipSuccessMessage?: boolean
}) => {
  try {
    const { isPrimaryKey, ...formattedPayload } = payload
    await updateDatabaseColumn({
      branch,
      originalColumn,
      payload: formattedPayload,
    })

    if (!skipPKCreation && isPrimaryKey !== undefined) {
      const existingPrimaryKeys = selectedTable.primary_keys.map((x) => x.name)

      // Primary key is getting updated for the column
      if (existingPrimaryKeys.length > 0 && primaryKey !== undefined) {
        await dropConstraint(branch, originalColumn.schema, originalColumn.table, primaryKey.name)
      }

      const columnName = formattedPayload.name ?? originalColumn.name
      const primaryKeyColumns = isPrimaryKey
        ? existingPrimaryKeys.concat([columnName])
        : existingPrimaryKeys.filter((x) => x !== columnName)

      if (primaryKeyColumns.length) {
        await addPrimaryKey(branch, originalColumn.schema, originalColumn.table, primaryKeyColumns)
      }
    }

    // Then update foreign keys
    if (foreignKeyRelations.length > 0) {
      await updateForeignKeys({
        branch,
        table: { schema: originalColumn.schema, name: originalColumn.table },
        foreignKeys: foreignKeyRelations,
        existingForeignKeyRelations,
      })
    }

    if (!skipSuccessMessage) toast.success(`Successfully updated column "${originalColumn.name}"`)
  } catch (error: any) {
    return { error }
  }
}

export const duplicateTable = async (
  branch: Branch,
  payload: { name: string; comment?: string },
  metadata: {
    duplicateTable: RetrieveTableResult
    isRLSEnabled: boolean
    isDuplicateRows: boolean
    foreignKeyRelations: ForeignKey[]
  }
) => {
  const queryClient = getQueryClient()
  const { duplicateTable, isRLSEnabled, isDuplicateRows, foreignKeyRelations } = metadata
  const { name: sourceTableName, schema: sourceTableSchema } = duplicateTable
  const duplicatedTableName = payload.name

  // The following query will copy the structure of the table along with indexes, constraints and
  // triggers. However, foreign key constraints are not duplicated over - has to be done separately
  await executeSql({
    branch,
    sql: [
      `CREATE TABLE "${sourceTableSchema}"."${duplicatedTableName}" (LIKE "${sourceTableSchema}"."${sourceTableName}" INCLUDING ALL);`,
      payload.comment !== undefined
        ? `comment on table "${sourceTableSchema}"."${duplicatedTableName}" is '${payload.comment}';`
        : '',
    ].join('\n'),
  })
  await queryClient.invalidateQueries(
    tableKeys.list(branch.organization_id, branch.project_id, branch.id, sourceTableSchema)
  )

  // Duplicate foreign key constraints over
  if (foreignKeyRelations.length > 0) {
    await addForeignKey({
      branch,
      table: { ...duplicateTable, name: payload.name },
      foreignKeys: foreignKeyRelations,
    })
  }

  // Duplicate rows if needed
  if (isDuplicateRows) {
    await executeSql({
      branch,
      sql: `INSERT INTO "${sourceTableSchema}"."${duplicatedTableName}" SELECT * FROM "${sourceTableSchema}"."${sourceTableName}";`,
    })

    // Insert into does not copy over auto increment sequences, so we manually do it next if any
    const columns = duplicateTable.columns ?? []
    const identityColumns = columns.filter((column) => column.identity_generation !== null)
    identityColumns.map(async (column) => {
      await executeSql({
        branch,
        sql: `SELECT setval('"${sourceTableSchema}"."${duplicatedTableName}_${column.name}_seq"', (SELECT MAX("${column.name}") FROM "${sourceTableSchema}"."${sourceTableName}"));`,
      })
    })
  }

  const tables = await queryClient.fetchQuery({
    queryKey: tableKeys.list(
      branch.organization_id,
      branch.project_id,
      branch.id,
      sourceTableSchema
    ),
    queryFn: ({ signal }) => getTables({ branch, schema: sourceTableSchema }, signal),
  })

  const duplicatedTable = find(tables, { schema: sourceTableSchema, name: duplicatedTableName })!

  if (isRLSEnabled) {
    await updateTableMutation({
      branch,
      id: duplicatedTable?.id!,
      name: duplicatedTable?.name!,
      schema: duplicatedTable?.schema!,
      payload: { rls_enabled: isRLSEnabled },
    })
  }

  return duplicatedTable
}

export const createTable = async ({
  branch,
  toastId,
  payload,
  columns = [],
  foreignKeyRelations,
  isRLSEnabled,
  importContent,
}: {
  branch: Branch
  toastId: string | number
  payload: {
    name: string
    schema: string
    comment?: string | undefined
  }
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  isRLSEnabled: boolean
  importContent?: ImportContent
}) => {
  const queryClient = getQueryClient()

  // Create the table first. Error may be thrown.
  await createTableMutation({
    branch,
    payload: payload,
  })

  const table = await queryClient.fetchQuery({
    queryKey: tableKeys.retrieve(
      branch.organization_id,
      branch.project_id,
      branch.id,
      payload.name,
      payload.schema
    ),
    queryFn: ({ signal }) =>
      getTable({ branch, name: payload.name, schema: payload.schema }, signal),
  })

  // If we face any errors during this process after the actual table creation
  // We'll delete the table as a way to clean up and not leave behind bits that
  // got through successfully. This is so that the user can continue editing in
  // the table side panel editor conveniently
  try {
    // Toggle RLS if configured to be
    if (isRLSEnabled) {
      await updateTableMutation({
        branch,
        id: table.id,
        name: table.name,
        schema: table.schema,
        payload: { rls_enabled: isRLSEnabled },
      })
    }

    // Then insert the columns - we don't do Promise.all as we want to keep the integrity
    // of the column order during creation. Note that we add primary key constraints separately
    // via the query endpoint to support composite primary keys as pg-meta does not support that OOB
    toast.loading(`Adding ${columns.length} columns to ${table.name}...`, { id: toastId })

    for (const column of columns) {
      // We create all columns without primary keys first
      const columnPayload = generateCreateColumnPayload(table, {
        ...column,
        isPrimaryKey: false,
      })
      await createDatabaseColumn({
        branch,
        payload: columnPayload,
      })
    }

    // Then add the primary key constraints here to support composite keys
    const primaryKeyColumns = columns
      .filter((column) => column.isPrimaryKey)
      .map((column) => column.name)
    if (primaryKeyColumns.length > 0) {
      await addPrimaryKey(branch, table.schema, table.name, primaryKeyColumns)
    }

    // Then add the foreign key constraints here
    if (foreignKeyRelations.length > 0) {
      await addForeignKey({
        branch,
        table: { schema: table.schema, name: table.name },
        foreignKeys: foreignKeyRelations,
      })
    }

    // If the user is importing data via a spreadsheet
    if (importContent !== undefined) {
      if (importContent.file && importContent.rowCount > 0) {
        // Via a CSV file
        const { error }: any = await insertRowsViaSpreadsheet(
          branch,
          importContent.file,
          table,
          importContent.selectedHeaders,
          (progress: number) => {
            toast.loading(
              <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                <SparkBar
                  value={progress}
                  max={100}
                  type="horizontal"
                  barClass="bg-brand"
                  labelBottom={`Adding ${importContent.rowCount.toLocaleString()} rows to ${table.name}`}
                  labelBottomClass=""
                  labelTop={`${progress.toFixed(2)}%`}
                  labelTopClass="tabular-nums"
                />
              </div>,
              { id: toastId }
            )
          }
        )

        // For identity columns, manually raise the sequences
        const identityColumns = columns.filter((column) => column.isIdentity)
        for (const column of identityColumns) {
          await executeSql({
            branch,
            sql: `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`,
          })
        }

        if (error !== undefined) {
          toast.error('Do check your spreadsheet if there are any discrepancies.')

          const message = `Table ${table.name} has been created but we ran into an error while inserting rows: ${error.message}`
          toast.error(message)
          console.error('Error:', { error, message })
        }
      } else {
        // Via text copy and paste
        await insertTableRows(
          branch,
          table,
          importContent.rows,
          importContent.selectedHeaders,
          (progress: number) => {
            toast.loading(
              <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                <SparkBar
                  value={progress}
                  max={100}
                  type="horizontal"
                  barClass="bg-brand"
                  labelBottom={`Adding ${importContent.rows.length.toLocaleString()} rows to ${table.name}`}
                  labelBottomClass=""
                  labelTop={`${progress.toFixed(2)}%`}
                  labelTopClass="tabular-nums"
                />
              </div>,
              { id: toastId }
            )
          }
        )

        // For identity columns, manually raise the sequences
        const identityColumns = columns.filter((column) => column.isIdentity)
        for (const column of identityColumns) {
          await executeSql({
            branch,
            sql: `SELECT setval('${table.name}_${column.name}_seq', (SELECT MAX("${column.name}") FROM "${table.name}"));`,
          })
        }
      }
    }

    await prefetchEditorTablePage({
      queryClient,
      branch,
      id: table.id,
    })

    // Finally, return the created table
    return table
  } catch (error) {
    deleteTableMutation({
      branch,
      id: table.id,
      name: table.name,
      schema: table.schema,
    })
    throw error
  }
}

export const updateTable = async ({
  branch,
  toastId,
  table,
  payload,
  columns,
  foreignKeyRelations,
  existingForeignKeyRelations,
  primaryKey,
}: {
  branch: Branch
  toastId: string | number
  table: RetrieveTableResult
  payload: UpdateTableBody
  columns: ColumnField[]
  foreignKeyRelations: ForeignKey[]
  existingForeignKeyRelations: ForeignKeyConstraint[]
  primaryKey?: Constraint
}) => {
  const queryClient = getQueryClient()

  // Prepare a check to see if primary keys to the tables were updated or not
  const primaryKeyColumns = columns
    .filter((column) => column.isPrimaryKey)
    .map((column) => column.name)

  const existingPrimaryKeyColumns = table.primary_keys.map((pk: PostgresPrimaryKey) => pk.name)
  const isPrimaryKeyUpdated = !isEqual(primaryKeyColumns, existingPrimaryKeyColumns)

  if (isPrimaryKeyUpdated) {
    // Remove any primary key constraints first (we'll add it back later)
    // If we do it later, and if the user deleted a PK column, we'd need to do
    // an additional check when removing PK if the column in the PK was removed
    // So doing this one step earlier, lets us skip that additional check.
    if (primaryKey !== undefined) {
      await dropConstraint(branch, table.schema, table.name, primaryKey.name)
    }
  }

  // Update the table
  await updateTableMutation({
    branch,
    id: table.id,
    name: table.name,
    schema: table.schema,
    payload,
  })

  const updatedTable = await queryClient.fetchQuery({
    queryKey: tableKeys.retrieve(
      branch.organization_id,
      branch.project_id,
      branch.id,
      payload.name ?? table.name,
      payload.schema ?? table.schema
    ),
    queryFn: ({ signal }) =>
      getTable(
        {
          branch,
          name: payload.name ?? table.name,
          schema: payload.schema ?? table.schema,
        },
        signal
      ),
  })

  const originalColumns = updatedTable.columns ?? []
  const columnIds = columns.map((column) => column.id)

  // Delete any removed columns
  const columnsToRemove = originalColumns.filter((column) => !columnIds.includes(column.id))
  for (const column of columnsToRemove) {
    toast.loading(`Removing column ${column.name} from ${updatedTable.name}`, { id: toastId })
    await deleteDatabaseColumn({
      branch,
      column,
    })
  }

  // Add any new columns / Update any existing columns
  let hasError = false
  for (const column of columns) {
    if (!column.id.includes(table.id.toString())) {
      toast.loading(`Adding column ${column.name} to ${updatedTable.name}`, { id: toastId })
      // Ensure that columns do not created as primary key first, cause the primary key will
      // be added later on further down in the code
      const columnPayload = generateCreateColumnPayload(updatedTable, {
        ...column,
        isPrimaryKey: false,
      })
      const { error } = await createColumn({
        branch,
        payload: columnPayload,
        selectedTable: updatedTable,
        skipSuccessMessage: true,
        toastId,
      })
      if (!!error) hasError = true
    } else {
      const originalColumn = find(originalColumns, { id: column.id })
      if (originalColumn) {
        const columnPayload = generateUpdateColumnPayload(originalColumn, updatedTable, column)
        if (!isEmpty(columnPayload)) {
          toast.loading(`Updating column ${column.name} from ${updatedTable.name}`, { id: toastId })

          const res = await updateColumn({
            branch,
            originalColumn: originalColumn,
            payload: columnPayload,
            selectedTable: updatedTable,
            skipPKCreation: true,
            skipSuccessMessage: true,
          })
          if (res?.error) {
            hasError = true
            toast.error(`Failed to update column "${column.name}": ${res.error.message}`)
          }
        }
      }
    }
  }

  // Then add back the primary keys again
  if (isPrimaryKeyUpdated && primaryKeyColumns.length > 0) {
    await addPrimaryKey(branch, updatedTable.schema, updatedTable.name, primaryKeyColumns)
  }

  // Foreign keys will get updated here accordingly
  await updateForeignKeys({
    branch,
    table: updatedTable,
    foreignKeys: foreignKeyRelations,
    existingForeignKeyRelations,
  })

  await Promise.all([
    queryClient.invalidateQueries(
      tableEditorKeys.tableEditor(branch.organization_id, branch.project_id, branch.id, table.id)
    ),
    queryClient.invalidateQueries(
      databaseKeys.foreignKeyConstraints(
        branch.organization_id,
        branch.project_id,
        branch.id,
        table.schema
      )
    ),
    queryClient.invalidateQueries(
      databaseKeys.tableDefinition(branch.organization_id, branch.project_id, branch.id, table.id)
    ),
    queryClient.invalidateQueries(
      entityTypeKeys.list(branch.organization_id, branch.project_id, branch.id)
    ),
    queryClient.invalidateQueries(
      tableKeys.list(branch.organization_id, branch.project_id, branch.id, table.schema, true)
    ),
  ])

  // We need to invalidate tableRowsAndCount after tableEditor
  // to ensure the query sent is correct
  await queryClient.invalidateQueries(
    tableRowKeys.tableRowsAndCount(branch.organization_id, branch.project_id, branch.id, table.id)
  )

  return {
    table: await prefetchTableEditor(queryClient, {
      branch,
      id: table.id,
    }),
    hasError,
  }
}

/**
 * Used in insertRowsViaSpreadsheet + insertTableRows
 */
export const formatRowsForInsert = ({
  rows,
  headers,
  columns = [],
}: {
  rows: any[]
  headers: string[]
  columns?: RetrieveTableResult['columns']
}) => {
  return rows.map((row: any) => {
    const formattedRow: any = {}
    headers.forEach((header) => {
      const column = columns?.find((c) => c.name === header)
      const originalValue = row[header]

      if ((column?.format ?? '').includes('json')) {
        formattedRow[header] = tryParseJson(originalValue)
      } else if ((column?.data_type ?? '') === 'ARRAY') {
        if (
          typeof originalValue === 'string' &&
          originalValue.startsWith('{') &&
          originalValue.endsWith('}')
        ) {
          const formattedPostgresArraytoJsonArray = `[${originalValue.slice(1, originalValue.length - 1)}]`
          formattedRow[header] = tryParseJson(formattedPostgresArraytoJsonArray)
        } else {
          formattedRow[header] = tryParseJson(originalValue)
        }
      } else if (originalValue === '') {
        formattedRow[header] = column?.is_nullable ? null : ''
      } else {
        formattedRow[header] = originalValue
      }
    })
    return formattedRow
  })
}

export const insertRowsViaSpreadsheet = async (
  branch: Branch,
  file: any,
  table: RetrieveTableResult,
  selectedHeaders: string[],
  onProgressUpdate: (progress: number) => void
) => {
  let chunkNumber = 0
  let insertError: any = undefined
  const t1: any = new Date()
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      // dynamicTyping has to be disabled so that "00001" doesn't get parsed as 1.
      dynamicTyping: false,
      skipEmptyLines: true,
      chunkSize: CHUNK_SIZE,
      quoteChar: file.type === 'text/tab-separated-values' ? '' : '"',
      chunk: async (results: any, parser: any) => {
        parser.pause()

        const formattedData = formatRowsForInsert({
          rows: results.data,
          headers: selectedHeaders,
          columns: table.columns,
        })

        const insertQuery = new Query().from(table.name, table.schema).insert(formattedData).toSql()
        try {
          await executeSql({ branch, sql: insertQuery })
        } catch (error) {
          console.warn(error)
          insertError = error
          parser.abort()
        }

        chunkNumber += 1
        const progress = (chunkNumber * CHUNK_SIZE) / file.size
        const progressPercentage = progress > 1 ? 100 : progress * 100
        onProgressUpdate(progressPercentage)
        parser.resume()
      },
      complete: () => {
        const t2: any = new Date()
        console.log(`Total time taken for importing spreadsheet: ${(t2 - t1) / 1000} seconds`)
        resolve({ error: insertError })
      },
    })
  })
}

export const insertTableRows = async (
  branch: Branch,
  table: RetrieveTableResult,
  rows: any,
  selectedHeaders: string[],
  onProgressUpdate: (progress: number) => void
) => {
  let insertError = undefined
  let insertProgress = 0

  const formattedRows = formatRowsForInsert({
    rows,
    headers: selectedHeaders,
    columns: table.columns,
  })

  const batches = chunk(formattedRows, BATCH_SIZE)
  const promises = batches.map((batch: any) => {
    return () => {
      return Promise.race([
        new Promise(async (resolve, reject) => {
          const insertQuery = new Query().from(table.name, table.schema).insert(batch).toSql()
          try {
            await executeSql({ branch, sql: insertQuery })
          } catch (error) {
            insertError = error
            reject(error)
          }

          insertProgress = insertProgress + batch.length / rows.length
          resolve({})
        }),
        timeout(30000),
      ])
    }
  })

  const batchedPromises = chunk(promises, 10)
  for (const batchedPromise of batchedPromises) {
    const res = await Promise.allSettled(batchedPromise.map((batch) => batch()))
    const hasFailedBatch = find(res, { status: 'rejected' })
    if (hasFailedBatch) break
    onProgressUpdate(insertProgress * 100)
  }
  return { error: insertError }
}

const updateForeignKeys = async ({
  branch,
  table,
  foreignKeys,
  existingForeignKeyRelations,
}: {
  branch: Branch
  table: { schema: string; name: string }
  foreignKeys: ForeignKey[]
  existingForeignKeyRelations: ForeignKeyConstraint[]
}) => {
  // Foreign keys will get updated here accordingly
  const relationsToAdd = foreignKeys.filter((x) => typeof x.id === 'string')
  if (relationsToAdd.length > 0) {
    await addForeignKey({
      branch,
      table,
      foreignKeys: relationsToAdd,
    })
  }

  const relationsToRemove = foreignKeys.filter((x) => x.toRemove)
  if (relationsToRemove.length > 0) {
    await removeForeignKey({
      branch,
      table,
      foreignKeys: relationsToRemove,
    })
  }

  const remainingRelations = foreignKeys.filter((x) => typeof x.id === 'number' && !x.toRemove)
  const relationsToUpdate = remainingRelations.filter((x) => {
    const existingRelation = existingForeignKeyRelations.find((y) => x.id === y.id)
    if (existingRelation !== undefined) {
      return checkIfRelationChanged(existingRelation as unknown as ForeignKeyConstraint, x)
    } else return false
  })
  if (relationsToUpdate.length > 0) {
    await updateForeignKey({
      branch,
      table,
      foreignKeys: relationsToUpdate,
    })
  }
}
