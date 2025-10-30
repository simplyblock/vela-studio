import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import type { components } from 'data/api'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { secretsKeys } from './keys'

export type SecretsVariables = {
  orgSlug?: string
  projectRef?: string
}

export type ProjectSecret = components['schemas']['SecretResponse']

export async function getSecrets({ orgSlug, projectRef }: SecretsVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('Organization slug is required')
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/secrets`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type SecretsData = Awaited<ReturnType<typeof getSecrets>>
export type SecretsError = ResponseError

export const useSecretsQuery = <TData = SecretsData>(
  { orgSlug, projectRef }: SecretsVariables,
  { enabled = true, ...options }: UseQueryOptions<SecretsData, SecretsError, TData> = {}
) =>
  useQuery<SecretsData, SecretsError, TData>(
    secretsKeys.list(orgSlug, projectRef),
    ({ signal }) => getSecrets({ orgRef: orgSlug, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined', ...options }
  )
