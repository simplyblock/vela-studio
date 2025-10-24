import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export type ProjectSettingsVariables = {
  orgSlug?: string
  projectRef?: string
}

// Manually add the protocol property to the response - specifically just for the local/CLI environment
type ProjectAppConfig = components['schemas']['ProjectSettingsResponse']['app_config'] & {
  protocol?: string
}
export type ProjectSettings = components['schemas']['ProjectSettingsResponse'] & {
  app_config?: ProjectAppConfig
}

export async function getProjectSettings(
  { orgSlug, projectRef }: ProjectSettingsVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/settings', {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef
      }
    },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as ProjectSettings
}

type ProjectSettingsData = Awaited<ReturnType<typeof getProjectSettings>>
type ProjectSettingsError = ResponseError

export const useProjectSettingsV2Query = <TData = ProjectSettingsData>(
  { orgSlug, projectRef }: ProjectSettingsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectSettingsData, ProjectSettingsError, TData> = {}
) => {
  const canReadAPIKeys = useCheckPermissions("branch:api:getkeys")

  return useQuery<ProjectSettingsData, ProjectSettingsError, TData>(
    configKeys.settingsV2(orgSlug, projectRef),
    ({ signal }) => getProjectSettings({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      refetchInterval(_data) {
        const data = _data as ProjectSettings | undefined
        const apiKeys = data?.service_api_keys ?? []
        const interval =
          canReadAPIKeys && data?.status !== 'INACTIVE' && apiKeys.length === 0 ? 2000 : 0
        return interval
      },
      ...options,
    }
  )
}
