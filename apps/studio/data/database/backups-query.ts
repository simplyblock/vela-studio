import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import { useIsOrioleDbInAws } from 'hooks/misc/useSelectedProject'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type BackupsVariables = {
  orgSlug?: string
  projectRef?: string
}

export type DatabaseBackup = components['schemas']['BackupsResponse']['backups'][number]

export async function getBackups({ orgSlug, projectRef }: BackupsVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/backups`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type BackupsData = Awaited<ReturnType<typeof getBackups>>
export type BackupsError = ResponseError

export const useBackupsQuery = <TData = BackupsData>(
  { orgSlug, projectRef }: BackupsVariables,
  { enabled = true, ...options }: UseQueryOptions<BackupsData, BackupsError, TData> = {}
) => {
  // [Joshen] Check for specifically false to account for project not loaded yet
  const isOrioleDbInAws = useIsOrioleDbInAws()

  return useQuery<BackupsData, BackupsError, TData>(
    databaseKeys.backups(projectRef),
    ({ signal }) => getBackups({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && !isOrioleDbInAws && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
}
