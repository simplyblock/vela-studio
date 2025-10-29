import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { platformKeys } from './keys'

export async function getAvailablePostgresVersions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/available-postgresql-versions', { signal })
  if (error) handleError(error)
  return data
}

export type AvailablePostgresVersionsData = Awaited<ReturnType<typeof getAvailablePostgresVersions>>
export type AvailablePostgresVersionsError = unknown

export const useAvailablePostgresVersionsQuery = <TData = AvailablePostgresVersionsData>(
  options: UseQueryOptions<
    AvailablePostgresVersionsData,
    AvailablePostgresVersionsError,
    TData
  > = {}
) =>
  useQuery<AvailablePostgresVersionsData, AvailablePostgresVersionsError, TData>(
    platformKeys.available_postgres_versions(),
    ({ signal }) => getAvailablePostgresVersions(signal),
    options
  )
