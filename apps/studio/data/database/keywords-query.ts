import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'
import { Branch } from 'api-types/types'

export const getKeywordsSql = () => {
  const sql = /* SQL */ `
SELECT word FROM pg_get_keywords();
`.trim()

  return sql
}

export type KeywordsVariables = {
  branch?: Branch
}

export async function getKeywords({ branch }: KeywordsVariables, signal?: AbortSignal) {
  const sql = getKeywordsSql()

  const { result } = await executeSql({ branch, sql, queryKey: ['keywords'] }, signal)

  return result.map((x: { word: string }) => x.word.toLocaleLowerCase()) as string[]
}

export type KeywordsData = Awaited<ReturnType<typeof getKeywords>>
export type KeywordsError = ExecuteSqlError

export const useKeywordsQuery = <TData = KeywordsData>(
  { branch }: KeywordsVariables,
  { enabled = true, ...options }: UseQueryOptions<KeywordsData, KeywordsError, TData> = {}
) =>
  useQuery<KeywordsData, KeywordsError, TData>(
    databaseKeys.keywords(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getKeywords({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
