import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'data/api'
import { ResponseError } from '../../types'
import { get, handleError } from '../fetchers'

export type ServiceUrlsResponse = components['schemas']['ServiceUrlsResponse']

export async function getServiceUrls(signal?: AbortSignal): Promise<ServiceUrlsResponse> {
  const { data, error } = await get('/platform/service-urls', {
    signal
  })
  if (error) handleError(error)
  return data
}

export const useServiceUrlsQuery = <TData = ServiceUrlsResponse>({
  enabled = true,
  ...options
}: UseQueryOptions<ServiceUrlsResponse, ResponseError, TData> = {}) => {
  return useQuery<ServiceUrlsResponse, ResponseError, TData>(
    ['service-urls'],
    ({signal}) => getServiceUrls(signal),
    { enabled, ...options }
  )
}