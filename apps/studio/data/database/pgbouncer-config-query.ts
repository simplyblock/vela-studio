import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerConfigVariables = {
  orgRef?: string
  projectRef?: string
  branchId?: string
}

export async function getPgbouncerConfig(
  { orgRef, projectRef, branchId }: PgbouncerConfigVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchId) throw new Error('branchId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/pgbouncer',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchId,
        },
      },
      signal,
    }
  )
  if (error) handleError(error)
  return data
}

export type PgbouncerConfigData = Awaited<ReturnType<typeof getPgbouncerConfig>>
export type PgbouncerConfigError = ResponseError

export const usePgbouncerConfigQuery = <TData = PgbouncerConfigData>(
  { orgRef, projectRef, branchId }: PgbouncerConfigVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerConfigData, PgbouncerConfigError, TData> = {}
) =>
  useQuery<PgbouncerConfigData, PgbouncerConfigError, TData>(
    databaseKeys.pgbouncerConfig(orgRef, projectRef, branchId),
    ({ signal }) => getPgbouncerConfig({ orgRef: orgRef, projectRef, branchId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof branchId !== 'undefined',
      ...options,
    }
  )
