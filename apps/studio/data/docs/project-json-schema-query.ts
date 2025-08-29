import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { docsKeys } from './keys'

export type ProjectJsonSchemaVariables = {
  orgSlug?: string
  projectRef?: string
}

type ProjectJsonSchemaMethod = {
  tags: string[]
  summary: string
  responses: {
    [key: string]: any
  }
  parameters: { [key: string]: string }[]
}

export type ProjectJsonSchemaDefinitions = {
  [key: string]: {
    type: string
    description: string
    required: string[]
    properties: {
      [key: string]: {
        type: string
        format: string
        description?: string
        enum?: string[]
      }
    }
  }
}

export type ProjectJsonSchemaPaths = {
  [key: string]: {
    get?: ProjectJsonSchemaMethod
    post?: ProjectJsonSchemaMethod
    patch?: ProjectJsonSchemaMethod
    delete?: ProjectJsonSchemaMethod
  }
}

export type ProjectJsonSchemaResponse = {
  basePath: string
  consumes: string[]
  definitions: ProjectJsonSchemaDefinitions
  externalDocs: { description: string; url: string }
  host: string
  info: {
    title: string
    description: string
    version: string
  }
  parameters: {
    [key: string]: {
      default?: string
      description: string
      in: string
      name: string
      required: boolean
      type?: string
      schema?: { [key: string]: string }
    }
  }
  paths: ProjectJsonSchemaPaths
  produces: string[]
  schemes: string[]
  swagger: string
}

export async function getProjectJsonSchema(
  { orgSlug, projectRef }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!orgSlug) throw new Error('orgSlug is required')
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/organizations/{slug}/projects/{ref}/api/rest', {
    params: { path: { slug: orgSlug, ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data as unknown as ProjectJsonSchemaResponse
}

export type ProjectJsonSchemaData = Awaited<ReturnType<typeof getProjectJsonSchema>>
export type ProjectJsonSchemaError = ResponseError

export const useProjectJsonSchemaQuery = <TData = ProjectJsonSchemaData>(
  { orgSlug, projectRef }: ProjectJsonSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectJsonSchemaData, ProjectJsonSchemaError, TData> = {}
) =>
  useQuery<ProjectJsonSchemaData, ProjectJsonSchemaError, TData>(
    docsKeys.jsonSchema(orgSlug, projectRef),
    ({ signal }) => getProjectJsonSchema({ orgSlug, projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof orgSlug !== 'undefined',
      ...options,
    }
  )
