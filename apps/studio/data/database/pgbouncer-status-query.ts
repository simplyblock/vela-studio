import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PgbouncerStatusVariables = {
  orgRef?: string
  projectRef?: string
  branchId?: string
}

export async function getPgbouncerStatus(
  { orgRef, projectRef, branchId }: PgbouncerStatusVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchId) throw new Error('branchId is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/pgbouncer/status',
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

export type PgbouncerStatusData = Awaited<ReturnType<typeof getPgbouncerStatus>>
export type PgbouncerStatusError = ResponseError

export const usePgbouncerStatusQuery = <TData = PgbouncerStatusData>(
  { projectRef, orgRef, branchId }: PgbouncerStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<PgbouncerStatusData, PgbouncerStatusError, TData> = {}
) =>
  useQuery<PgbouncerStatusData, PgbouncerStatusError, TData>(
    databaseKeys.pgbouncerStatus(orgRef, projectRef, branchId),
    ({ signal }) => getPgbouncerStatus({ orgRef, projectRef, branchId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
