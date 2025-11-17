import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { logDrainsKeys } from './keys'
import { ResponseError } from 'types'

export type LogDrainsVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export async function getLogDrains(
  { orgRef, projectRef, branchRef }: LogDrainsVariables,
  signal?: AbortSignal
) {
  if (!orgRef) {
    throw new Error('Organization ref is required')
  }
  if (!projectRef) {
    throw new Error('Project ref is required')
  }
  if (!branchRef) {
    throw new Error('Branch ref is required')
  }

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}/analytics/log-drains`,
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      signal,
    }
  )

  if (error) {
    handleError(error)
  }

  return data
}

export type LogDrainsData = Awaited<ReturnType<typeof getLogDrains>>
export type LogDrainData = LogDrainsData[number]
export type LogDrainsyError = ResponseError

export const useLogDrainsQuery = <TData = LogDrainsData>(
  { orgRef, projectRef, branchRef }: LogDrainsVariables,
  { enabled = true, ...options }: UseQueryOptions<LogDrainsData, LogDrainsyError, TData> = {}
) =>
  useQuery<LogDrainsData, LogDrainsyError, TData>(
    logDrainsKeys.list(orgRef, projectRef, branchRef),
    ({ signal }) => getLogDrains({ orgRef, projectRef, branchRef }, signal),
    {
      enabled: enabled && !!orgRef && !!projectRef && !!branchRef,
      refetchOnMount: false,
      ...options,
    }
  )
