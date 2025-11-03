import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { apiKeysKeys } from './../keys'

export interface APIKeyVariables {
  orgRef?: string
  projectRef?: string
  id?: string
  reveal: boolean
}

export async function getAPIKeysById(
  { orgRef, projectRef, id, reveal }: APIKeyVariables,
  signal?: AbortSignal
) {
  if (typeof orgRef === 'undefined') throw new Error('orgRef is required')
  if (typeof projectRef === 'undefined') throw new Error('projectRef is required')
  if (typeof id === 'undefined') throw new Error('Content ID is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/api-keys/{id}', {
    params: {
      path: {
        slug: orgRef,
        ref: projectRef,
        id,
      },
      query: { reveal },
    },
    signal,
  })

  if (error) {
    handleError(error)
  }

  return data
}

export type APIKeyIdData = Awaited<ReturnType<typeof getAPIKeysById>>

export const useAPIKeyIdQuery = <TData = APIKeyIdData>(
  { orgRef, projectRef, id, reveal }: APIKeyVariables,
  { enabled = true, ...options }: UseQueryOptions<APIKeyIdData, ResponseError, TData> = {}
) =>
  useQuery<APIKeyIdData, ResponseError, TData>(
    apiKeysKeys.single(projectRef, id),
    ({ signal }) => getAPIKeysById({ projectRef, id, reveal }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof id !== 'undefined' &&
        typeof orgRef !== 'undefined',
      ...options,
    }
  )
