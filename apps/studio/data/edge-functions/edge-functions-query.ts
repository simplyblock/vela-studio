import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { edgeFunctionsKeys } from './keys'

export type EdgeFunctionsVariables = { orgRef?: string; projectRef?: string }

export type EdgeFunctionsResponse = components['schemas']['FunctionResponse']

export async function getEdgeFunctions(
  { orgRef, projectRef }: EdgeFunctionsVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/functions`, {
    params: {
      path: {
        slug: orgRef,
        ref: projectRef,
      },
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type EdgeFunctionsData = Awaited<ReturnType<typeof getEdgeFunctions>>
export type EdgeFunctionsError = ResponseError

export const useEdgeFunctionsQuery = <TData = EdgeFunctionsData>(
  { orgRef, projectRef }: EdgeFunctionsVariables,
  { enabled = true, ...options }: UseQueryOptions<EdgeFunctionsData, EdgeFunctionsError, TData> = {}
) =>
  useQuery<EdgeFunctionsData, EdgeFunctionsError, TData>(
    edgeFunctionsKeys.list(projectRef),
    ({ signal }) => getEdgeFunctions({ orgRef: orgRef, projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined', ...options }
  )
