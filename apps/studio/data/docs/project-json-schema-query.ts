import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { docsKeys } from './keys'

export type ProjectJsonSchemaVariables = {
  orgRef?: string
  projectRef?: string
  branchRef?: string
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
  { orgRef, projectRef, branchRef }: ProjectJsonSchemaVariables,
  signal?: AbortSignal
) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/api/rest',
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
  return data as unknown as ProjectJsonSchemaResponse
}

export type ProjectJsonSchemaData = Awaited<ReturnType<typeof getProjectJsonSchema>>
export type ProjectJsonSchemaError = ResponseError

export const useProjectJsonSchemaQuery = <TData = ProjectJsonSchemaData>(
  { orgRef, projectRef, branchRef }: ProjectJsonSchemaVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ProjectJsonSchemaData, ProjectJsonSchemaError, TData> = {}
) =>
  useQuery<ProjectJsonSchemaData, ProjectJsonSchemaError, TData>(
    docsKeys.jsonSchema(orgRef, projectRef, branchRef),
    ({ signal }) => getProjectJsonSchema({ orgRef, projectRef, branchRef }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof orgRef !== 'undefined' &&
        typeof branchRef !== 'undefined',
      ...options,
    }
  )
