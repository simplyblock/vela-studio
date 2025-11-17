import { useQuery } from '@tanstack/react-query'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'

import {
  EXPLORER_DATEPICKER_HELPERS,
  getDefaultHelper,
} from 'components/interfaces/Settings/Logs/Logs.constants'
import type {
  LogData,
  Logs,
  LogsEndpointParams,
} from 'components/interfaces/Settings/Logs/Logs.types'
import {
  checkForILIKEClause,
  checkForWithClause,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { get } from 'data/fetchers'

export interface LogsQueryHook {
  params: LogsEndpointParams
  isLoading: boolean
  logData: LogData[]
  data?: never
  error: string | Object | null
  changeQuery: (newQuery?: string) => void
  runQuery: () => void
  setParams: Dispatch<SetStateAction<LogsEndpointParams>>
  enabled?: boolean
}

const useLogsQuery = (
  orgRef: string,
  projectRef: string,
  branchRef: string,
  initialParams: Partial<LogsEndpointParams> = {},
  enabled = true
): LogsQueryHook => {
  const defaultHelper = getDefaultHelper(EXPLORER_DATEPICKER_HELPERS)
  const [params, setParams] = useState<LogsEndpointParams>({
    sql: initialParams?.sql || '',
    iso_timestamp_start: initialParams.iso_timestamp_start
      ? initialParams.iso_timestamp_start
      : defaultHelper.calcFrom(),
    iso_timestamp_end: initialParams.iso_timestamp_end
      ? initialParams.iso_timestamp_end
      : defaultHelper.calcTo(),
  })

  useEffect(() => {
    setParams((prev) => ({
      ...prev,
      ...initialParams,
      sql: initialParams?.sql ?? prev.sql,
      iso_timestamp_start: initialParams.iso_timestamp_start ?? prev.iso_timestamp_start,
      iso_timestamp_end: initialParams.iso_timestamp_end ?? prev.iso_timestamp_end,
    }))
  }, [initialParams.sql, initialParams.iso_timestamp_start, initialParams.iso_timestamp_end])

  const _enabled = enabled && typeof projectRef !== 'undefined' && Boolean(params.sql)

  const usesWith = checkForWithClause(params.sql || '')
  const usesILIKE = checkForILIKEClause(params.sql || '')

  const {
    data,
    error: rqError,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery(
    ['branches', orgRef, projectRef, branchRef, 'logs', params],
    async ({ signal }) => {
      const { data, error } = await get(
        `/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/endpoints/logs.all`,
        {
          params: {
            path: {
              slug: orgRef,
              ref: projectRef,
              branch: branchRef,
            },
            query: params,
          },
          signal,
        }
      )
      if (error) {
        throw error
      }

      return data as unknown as Logs
    },
    {
      enabled: _enabled,
      refetchOnWindowFocus: false,
    }
  )

  let error: null | string | object = rqError ? (rqError as any).message : null

  if (!error && data?.error) {
    error = data?.error
  }

  if (usesWith) {
    error = {
      message: 'The parser does not yet support WITH and subquery statements.',
      docs: 'https://vela.run/docs/guides/platform/advanced-log-filtering#the-with-keyword-and-subqueries-are-not-supported',
    }
  }
  if (usesILIKE) {
    error = {
      message: 'BigQuery does not support ILIKE. Use REGEXP_CONTAINS instead.',
      docs: 'https://vela.run/docs/guides/platform/advanced-log-filtering#the-ilike-and-similar-to-keywords-are-not-supported',
    }
  }
  const changeQuery = (newQuery = '') => {
    setParams((prev) => ({ ...prev, sql: newQuery }))
  }

  return {
    params,
    isLoading: (_enabled && isLoading) || isRefetching,
    logData: data?.result ?? [],
    error,
    changeQuery,
    runQuery: () => refetch(),
    setParams,
  }
}
export default useLogsQuery
