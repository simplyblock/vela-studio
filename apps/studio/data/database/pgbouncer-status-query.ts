import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerStatusVariables = {
  orgSlug?: string
  projectRef?: string
  branchId?: string
}

export async function getPgbouncerStatus(
  { orgSlug, projectRef, branchId }: PgbouncerStatusVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchId) throw new Error('branchId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/pgbouncer/status',
    {
      params: {
        path: {
          slug: orgSlug,
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

export type PgbouncerStatusData = Awaited<ReturnType<typeof getPgbouncerStatus>>
export type PgbouncerStatusError = ResponseError

export const usePgbouncerStatusQuery = <TData = PgbouncerStatusData>(
  { projectRef, orgSlug, branchId }: PgbouncerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerStatusData, PgbouncerStatusError, TData> = {}
) =>
  useQuery<PgbouncerStatusData, PgbouncerStatusError, TData>(
    databaseKeys.pgbouncerStatus(orgSlug, projectRef, branchId),
    ({ signal }) => getPgbouncerStatus({ orgRef: orgSlug, projectRef, branchId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
