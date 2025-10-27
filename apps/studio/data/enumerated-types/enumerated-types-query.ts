import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { enumeratedTypesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type EnumeratedTypesVariables = {
  branch?: Branch
}

export type EnumeratedType = components['schemas']['PostgresType']

export async function getEnumeratedTypes(
  { branch }: EnumeratedTypesVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/types', {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type EnumeratedTypesData = Awaited<ReturnType<typeof getEnumeratedTypes>>
export type EnumeratedTypesError = ResponseError

export const useEnumeratedTypesQuery = <TData = EnumeratedTypesData>(
  { branch }: EnumeratedTypesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EnumeratedTypesData, EnumeratedTypesError, TData> = {}
) =>
  useQuery<EnumeratedTypesData, EnumeratedTypesError, TData>(
    enumeratedTypesKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getEnumeratedTypes({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
