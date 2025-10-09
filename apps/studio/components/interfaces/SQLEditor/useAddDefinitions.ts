import { Monaco } from '@monaco-editor/react'
import { IDisposable } from 'monaco-editor'
import { useEffect, useRef } from 'react'

import { LOCAL_STORAGE_KEYS } from 'common'
import getPgsqlCompletionProvider from 'components/ui/CodeEditor/Providers/PgSQLCompletionProvider'
import getPgsqlSignatureHelpProvider from 'components/ui/CodeEditor/Providers/PgSQLSignatureHelpProvider'
import { useDatabaseFunctionsQuery } from 'data/database-functions/database-functions-query'
import { useKeywordsQuery } from 'data/database/keywords-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTableColumnsQuery } from 'data/database/table-columns-query'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { formatSql } from 'lib/formatSql'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { useSelectedBranchQuery } from 'data/branches/selected-branch-query'

export const useAddDefinitions = (id: string, monaco: Monaco | null) => {
  const { data: branch } = useSelectedBranchQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [intellisenseEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_INTELLISENSE,
    true
  )

  const { data: keywords, isSuccess: isKeywordsSuccess } = useKeywordsQuery(
    {
      branch,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: functions, isSuccess: isFunctionsSuccess } = useDatabaseFunctionsQuery(
    {
      branch,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: schemas, isSuccess: isSchemasSuccess } = useSchemasQuery(
    {
      branch,
    },
    { enabled: intellisenseEnabled }
  )
  const { data: tableColumns, isSuccess: isTableColumnsSuccess } = useTableColumnsQuery(
    {
      branch,
    },
    { enabled: intellisenseEnabled }
  )

  const pgInfoRef = useRef<any>(null)

  const isPgInfoReady =
    intellisenseEnabled &&
    isTableColumnsSuccess &&
    isSchemasSuccess &&
    isKeywordsSuccess &&
    isFunctionsSuccess

  if (isPgInfoReady) {
    if (pgInfoRef.current === null) {
      pgInfoRef.current = {}
    }
    pgInfoRef.current.tableColumns = tableColumns
    pgInfoRef.current.schemas = schemas
    pgInfoRef.current.keywords = keywords
    pgInfoRef.current.functions = functions
  }

  //  Enable pgsql format
  useEffect(() => {
    if (monaco) {
      const formatProvider = monaco.languages.registerDocumentFormattingEditProvider('pgsql', {
        async provideDocumentFormattingEdits(model) {
          const value = model.getValue()
          const formatted = formatSql(value)
          if (id) snapV2.setSql(id, formatted)
          return [{ range: model.getFullModelRange(), text: formatted }]
        },
      })
      return () => formatProvider.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco])

  // Register auto completion item provider for pgsql
  useEffect(() => {
    let completeProvider: IDisposable | null = null
    let signatureHelpProvider: IDisposable | null = null

    if (isPgInfoReady) {
      if (monaco && isPgInfoReady) {
        completeProvider = monaco.languages.registerCompletionItemProvider(
          'pgsql',
          getPgsqlCompletionProvider(monaco, pgInfoRef)
        )
        signatureHelpProvider = monaco.languages.registerSignatureHelpProvider(
          'pgsql',
          getPgsqlSignatureHelpProvider(monaco, pgInfoRef)
        )
      }
    }
    return () => {
      completeProvider?.dispose()
      signatureHelpProvider?.dispose()
    }
  }, [isPgInfoReady, monaco])
}
