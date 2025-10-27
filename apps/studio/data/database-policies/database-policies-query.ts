import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import type { ResponseError } from 'types'
import { databasePoliciesKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type DatabasePoliciesVariables = {
  branch?: Branch
  schema?: string
}

export async function getDatabasePolicies(
  { branch, schema }: DatabasePoliciesVariables,
  signal?: AbortSignal,
) {
  if (!branch) throw new Error('branch is required')

  const { data, error } = await get(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/meta/policies',
    {
      params: {
        path: {
          slug: branch.organization_id,
          ref: branch.project_id,
          branch: branch.id,
        },
        query: {
          included_schemas: schema || '',
          excluded_schemas: '',
        },
      },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type DatabasePoliciesData = Awaited<ReturnType<typeof getDatabasePolicies>>
export type DatabasePoliciesError = ResponseError

export const useDatabasePoliciesQuery = <TData = DatabasePoliciesData>(
  { branch, schema }: DatabasePoliciesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabasePoliciesData, DatabasePoliciesError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DatabasePoliciesData, DatabasePoliciesError, TData>(
    databasePoliciesKeys.list(branch?.organization_id, branch?.project_id, branch?.id, schema),
    ({ signal }) => getDatabasePolicies({ branch, schema }, signal),
    {
      enabled: enabled && typeof branch !== 'undefined' && isActive,
      ...options,
    }
  )
}
