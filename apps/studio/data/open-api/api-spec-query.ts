import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { openApiKeys } from './keys'

export type OpenAPISpecVariables = {
  orgRef?: string
  projectRef?: string
}

export type OpenAPISpecResponse = {
  data: any
  tables: any[]
  functions: any[]
}

export async function getOpenAPISpec(
  { orgRef, projectRef }: OpenAPISpecVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get(`/platform/organizations/{slug}/projects/{ref}/api/rest`, {
    params: {
      path: {
        slug: orgRef,
        ref: projectRef,
      },
    },
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
  { orgRef, projectRef }: OpenAPISpecVariables,
  { enabled = true, ...options }: UseQueryOptions<OpenAPISpecData, OpenAPISpecError, TData> = {}
) =>
  useQuery<OpenAPISpecData, OpenAPISpecError, TData>(
    openApiKeys.apiSpec(orgRef, projectRef),
    ({ signal }) => getOpenAPISpec({ orgRef, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgRef !== 'undefined',
      ...options,
    }
  )
