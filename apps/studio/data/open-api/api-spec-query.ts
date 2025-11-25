import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { openApiKeys } from './keys'

export type OpenAPISpecVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
}

export type OpenAPISpecResponse = {
  data: any
  tables: any[]
  functions: any[]
}

export async function getOpenAPISpec(
  { orgRef, projectRef, branchRef }: OpenAPISpecVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await get(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}/api/rest`,
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      signal,
    }
  )

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
  { orgRef, projectRef, branchRef }: OpenAPISpecVariables,
  { enabled = true, ...options }: UseQueryOptions<OpenAPISpecData, OpenAPISpecError, TData> = {}
) =>
  useQuery<OpenAPISpecData, OpenAPISpecError, TData>(
    openApiKeys.apiSpec(orgRef, projectRef, branchRef),
    ({ signal }) => getOpenAPISpec({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof orgRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      ...options,
    }
  )
