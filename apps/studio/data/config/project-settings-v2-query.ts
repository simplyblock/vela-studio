import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { configKeys } from './keys'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'

export type ProjectSettingsVariables = {
  orgRef?: string
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
  { orgRef, projectRef }: ProjectSettingsVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/settings', {
    params: {
      path: {
        slug: orgRef,
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

// FIXME: @Chris is this still required as settins are in the branch now
export const useProjectSettingsV2Query = <TData = ProjectSettingsData>(
  { orgRef, projectRef }: ProjectSettingsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectSettingsData, ProjectSettingsError, TData> = {}
) => {
  const canReadAPIKeys = useCheckPermissions("branch:api:getkeys")

  return useQuery<ProjectSettingsData, ProjectSettingsError, TData>(
    configKeys.settingsV2(orgRef, projectRef),
    ({ signal }) => getProjectSettings({ orgRef, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined',
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
