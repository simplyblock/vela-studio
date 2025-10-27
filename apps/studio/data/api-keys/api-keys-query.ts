import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { apiKeysKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

type LegacyKeys = {
  api_key: string
  description?: string | null
  hash?: string | null
  id?: string | null
  inserted_at?: string | null
  name: string
  prefix?: string | null
  secret_jwt_template?: { role: string } | null
  type: 'legacy' | null
  updated_at?: string | null
}

type SecretKeys = {
  api_key: string
  description?: string
  hash: string
  id: string
  inserted_at: string
  name: string
  prefix: string
  secret_jwt_template: { role: string }
  type: 'secret'
  updated_at?: string
}

type PublishableKeys = {
  api_key: string
  description?: string
  hash?: string
  id: string
  inserted_at: string
  name: string
  prefix?: string
  secret_jwt_template?: { role: string } | null
  type: 'publishable'
  updated_at?: string
}

interface APIKeysVariables {
  branch?: Branch
  reveal?: boolean
}

type APIKey = LegacyKeys | SecretKeys | PublishableKeys

async function getAPIKeys({ branch, reveal }: APIKeysVariables, signal?: AbortSignal) {
  if (!branch) throw new Error('branch is required')
  // FIXME: Guess this also needs to move to a branch level
  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/api-keys`, {
    params: {
      path: {
        slug: branch.organization_id,
        ref: branch.project_id,
      },
      query: {
        reveal,
      },
    },
    signal,
  })

  if (error) handleError(error)

  // [Jonny]: Overriding the types here since some stuff is not actually nullable or optional
  return data as unknown as APIKey[]
}

export type APIKeysData = Awaited<ReturnType<typeof getAPIKeys>>

export const useAPIKeysQuery = <TData = APIKeysData>(
  { branch, reveal = false }: APIKeysVariables,
  { enabled = true, ...options }: UseQueryOptions<APIKeysData, ResponseError, TData> = {}
) => {
  return useQuery<APIKeysData, ResponseError, TData>(
    apiKeysKeys.list(branch?.organization_id, branch?.project_id, branch?.id, reveal),
    ({ signal }) => getAPIKeys({ branch, reveal }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined',
      ...options,
    }
  )
}

export const getKeys = (apiKeys: APIKey[] = []) => {
  const anonKey = apiKeys.find((x) => x.name === 'anon')
  const serviceKey = apiKeys.find((x) => x.name === 'service_role')

  // [Joshen] For now I just want 1 of each, I don't need all
  const publishableKey = apiKeys.find((x) => x.type === 'publishable')
  const secretKey = apiKeys.find((x) => x.type === 'secret')

  const allSecretKeys = apiKeys.filter((x) => x.type === 'secret')

  return { anonKey, serviceKey, publishableKey, secretKey, allSecretKeys }
}
