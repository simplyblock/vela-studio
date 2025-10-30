import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { sslEnforcementKeys } from './keys'

export type SSLEnforcementVariables = { orgSlug?: string, projectRef?: string }

export async function getSSLEnforcementConfiguration(
  { orgSlug, projectRef }: SSLEnforcementVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/ssl-enforcement`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  // Not allowed error is a valid response to denote if a project
  // has access to the SSL enforcement UI, so we'll handle it here
  if (error) {
    const isNotAllowedError =
      (error as any)?.code === 400 &&
      (error as any)?.message?.includes('not allowed to configure SSL enforcements')

    if (isNotAllowedError) {
      return {
        appliedSuccessfully: false,
        currentConfig: { database: false },
        isNotAllowed: true,
      } as const
    } else {
      handleError(error)
    }
  }

  return data
}

export type SSLEnforcementData = Awaited<ReturnType<typeof getSSLEnforcementConfiguration>>
export type SSLEnforcementError = unknown

export const useSSLEnforcementQuery = <TData = SSLEnforcementData>(
  { orgSlug, projectRef }: SSLEnforcementVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<SSLEnforcementData, SSLEnforcementError, TData> = {}
) =>
  useQuery<SSLEnforcementData, SSLEnforcementError, TData>(
    sslEnforcementKeys.list(orgSlug, projectRef),
    ({ signal }) => getSSLEnforcementConfiguration({ orgRef: orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined', ...options }
  )
