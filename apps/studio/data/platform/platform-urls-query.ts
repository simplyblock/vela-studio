import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { platformKeys } from './keys'

export async function getPlatformServiceUrls(signal?: AbortSignal) {
  const { data, error } = await get('/platform/service-urls', { signal })
  if (error) handleError(error)
  return data
}

export type PlatformStatusData = Awaited<ReturnType<typeof getPlatformServiceUrls>>
export type PlatformStatusError = unknown

export const usePlatformServiceUrlsQuery = <TData = PlatformStatusData>(
  options: UseQueryOptions<PlatformStatusData, PlatformStatusError, TData> = {}
) =>
  useQuery<PlatformStatusData, PlatformStatusError, TData>(
    platformKeys.serviceUrls(),
    ({ signal }) => getPlatformServiceUrls(signal),
    options
  )
