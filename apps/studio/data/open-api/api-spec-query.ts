import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { openApiKeys } from './keys'

export type OpenAPISpecVariables = {
  orgSlug?: string
  projectRef?: string
}

export type OpenAPISpecResponse = {
  data: any
  tables: any[]
  functions: any[]
}

export async function getOpenAPISpec({ orgSlug, projectRef }: OpenAPISpecVariables, signal?: AbortSignal) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/api/rest`, {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)

  const definitions = (data as any).definitions
  const tables = definitions
    ? Object.entries(definitions).map(([key, table]: any) => ({
        ...table,
        name: key,
        fields: Object.entries(table.properties || {}).map(([key, field]: any) => ({
          ...field,
          name: key,
        })),
      }))
    : []

  const paths = (data as any).paths
  const functions = paths
    ? Object.entries(paths)
        .map(([path, value]: any) => ({
          ...value,
          path,
          name: path.replace('/rpc/', ''),
        }))
        .filter((x) => x.path.includes('/rpc'))
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  return { data: data, tables, functions }
}

export type OpenAPISpecData = Awaited<OpenAPISpecResponse>
export type OpenAPISpecError = ResponseError

export const useOpenAPISpecQuery = <TData = OpenAPISpecData>(
  { orgSlug, projectRef }: OpenAPISpecVariables,
  { enabled = true, ...options }: UseQueryOptions<OpenAPISpecData, OpenAPISpecError, TData> = {}
) =>
  useQuery<OpenAPISpecData, OpenAPISpecError, TData>(
    openApiKeys.apiSpec(orgSlug, projectRef),
    ({ signal }) => getOpenAPISpec({ orgRef: orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
