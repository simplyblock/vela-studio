import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { authKeys } from './keys'
import { Filter } from './users-infinite-query'
import { Branch } from 'api-types/types'
import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'

type Variables = {
  branch?: Branch
  filter: {
    user?: string
    dateFrom?: number
    dateTo?: number
    errors_only?: boolean
  }
}

const getLogs = async (
  { branch, filter }: Variables,
  signal?: AbortSignal
) => {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/auth/logs',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: filter,
      },
      signal,
    }
  )

  if (error) handleError(error)

  return data
}

export type LogsData = Awaited<ReturnType<typeof getLogs>>
export type LogsError = ResponseError

export const useLogsQuery = <TData = LogsData>(
  { branch, filter }: Variables,
  { enabled = true, ...options }: UseQueryOptions<LogsData, LogsError, TData> = {}
) =>
  useQuery<LogsData, LogsError, TData>(
    authKeys.logs(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getLogs({ branch, filter }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
