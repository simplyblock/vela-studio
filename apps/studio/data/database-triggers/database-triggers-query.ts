import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { Branch } from 'api-types/types'

export type DatabaseTriggersVariables = {
  branch?: Branch
}

export async function getDatabaseTriggers(
  { branch }: DatabaseTriggersVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/triggers', {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
        branch: branch.id
      },
      query: undefined as any,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = ResponseError

export const useDatabaseHooksQuery = <TData = DatabaseTriggersData>(
  { branch }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseTriggers({ branch }, signal),
    {
      select: (data) => {
        return data.filter((trigger) => {
          return (
            trigger.function_schema === 'supabase_functions' &&
            (trigger.schema !== 'net' || trigger.function_args.length === 0)
          )
        }) as any
      },
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )

export const useDatabaseTriggersQuery = <TData = DatabaseTriggersData>(
  { branch }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getDatabaseTriggers({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
