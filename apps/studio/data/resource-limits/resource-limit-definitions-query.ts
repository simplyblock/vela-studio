import { get, handleError } from '../fetchers'
import { ResponseError } from '../../types'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { resourceLimitsKeys } from './keys'

async function getResourceLimitDefinitions(signal?: AbortSignal) {
  const { data, error } = await get('/platform/resource-limits', { signal })
  if (error) handleError(error)
  return data
}

export type AvailableResourceLimitDefinitionsData = Awaited<
  ReturnType<typeof getResourceLimitDefinitions>
>
export type AvailableResourceLimitDefinitionsError = ResponseError

export const useResourceLimitDefinitionsQuery = <TData = AvailableResourceLimitDefinitionsData>(
  options: UseQueryOptions<
    AvailableResourceLimitDefinitionsData,
    AvailableResourceLimitDefinitionsError,
    TData
  > = {}
) =>
  useQuery<AvailableResourceLimitDefinitionsData, AvailableResourceLimitDefinitionsError, TData>(
    resourceLimitsKeys.system_resource_limits(),
    ({ signal }) => getResourceLimitDefinitions(signal),
    {
      ...options,
      staleTime: Infinity,
    }
  )
