import { JwtSecretUpdateStatus } from '@supabase/shared-types/out/events'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { configKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type JwtSecretUpdatingStatusVariables = {
  branch?: Branch
}

export type JwtSecretUpdatingStatusResponse = {
  changeTrackingId: string | undefined
  jwtSecretUpdateError: number | null | undefined
  jwtSecretUpdateProgress: number | null | undefined
  jwtSecretUpdateStatus: JwtSecretUpdateStatus | undefined
}

export async function getJwtSecretUpdatingStatus(
  { branch }: JwtSecretUpdatingStatusVariables,
  signal?: AbortSignal
) {
  if (!branch) throw new Error('Branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/config/secrets/update-status',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
        },
      },
      signal,
    }
  )

  if (error) handleError(error)

  const meta = data.update_status

  return meta
    ? ({
        changeTrackingId: meta.change_tracking_id,
        jwtSecretUpdateError: meta.error,
        jwtSecretUpdateProgress: meta.progress,
        jwtSecretUpdateStatus: meta.status,
      } as JwtSecretUpdatingStatusResponse)
    : null
}

export type JwtSecretUpdatingStatusData = Awaited<ReturnType<typeof getJwtSecretUpdatingStatus>>
export type JwtSecretUpdatingStatusError = unknown

export const useJwtSecretUpdatingStatusQuery = <TData = JwtSecretUpdatingStatusData>(
  { branch }: JwtSecretUpdatingStatusVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<JwtSecretUpdatingStatusData, JwtSecretUpdatingStatusError, TData> = {}
) => {
  const client = useQueryClient()

  return useQuery<JwtSecretUpdatingStatusData, JwtSecretUpdatingStatusError, TData>(
    configKeys.jwtSecretUpdatingStatus(branch?.organization_id, branch?.project_id, branch?.id),
    ({ signal }) => getJwtSecretUpdatingStatus({ branch }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      refetchInterval(data) {
        if (!data) {
          return false
        }

        const { jwtSecretUpdateStatus } = data as unknown as JwtSecretUpdatingStatusResponse

        const interval = jwtSecretUpdateStatus === JwtSecretUpdateStatus.Updating ? 1000 : false

        return interval
      },
      onSuccess() {
        client.invalidateQueries(
          configKeys.postgrest(branch?.organization_id, branch?.project_id, branch?.id)
        )
      },
      ...options,
    }
  )
}
