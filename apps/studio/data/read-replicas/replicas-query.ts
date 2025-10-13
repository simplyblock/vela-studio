import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { replicaKeys } from './keys'
import { Branch } from 'api-types/types'

export const MAX_REPLICAS_BELOW_XL = 2
export const MAX_REPLICAS_ABOVE_XL = 5

export type ReadReplicasVariables = {
  branch?: Branch
}

export type Database = components['schemas']['DatabaseDetailResponse']

export async function getReadReplicas({ branch }: ReadReplicasVariables, signal?: AbortSignal) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/branches/{branch}/databases`, {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ReadReplicasData = Awaited<ReturnType<typeof getReadReplicas>>
export type ReadReplicasError = ResponseError

export const useReadReplicasQuery = <TData = ReadReplicasData>(
  { branch }: ReadReplicasVariables,
  { enabled = true, ...options }: UseQueryOptions<ReadReplicasData, ReadReplicasError, TData> = {}
) => {
  return useQuery<ReadReplicasData, ReadReplicasError, TData>(
    replicaKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getReadReplicas({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
}

export const usePrimaryDatabase = ({ branch }: { branch?: Branch }) => {
  const {
    data: databases = [],
    error,
    isLoading,
    isError,
    isSuccess,
  } = useReadReplicasQuery({ branch })
  const primaryDatabase = databases.find((x) => x.identifier === branch?.project_id)
  return { database: primaryDatabase, error, isLoading, isError, isSuccess }
}
