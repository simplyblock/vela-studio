import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'
import { components } from '../vela/vela-schema'

const WHITELIST_ERRORS = [
  'The following organization members have reached their maximum limits for the number of active free projects',
  'db_pass must be longer than or equal to 4 characters',
  'There are overdue invoices in the organization(s)',
  'name should not contain a . string',
  'Project creation in the Vela dashboard is disabled for this Vercel-managed organization.',
  'Your account, which is handled by the Fly Vela extension, cannot access this endpoint.',
  'already exists in your organization.',
]

type CreateProjectBody = components['schemas']['ProjectCreate']

export type ProjectCreateVariables = {
  organizationSlug: string
  parameters: CreateProjectBody
}

export async function createProject(vars: ProjectCreateVariables) {
  const { data, error } = await post(`/platform/organizations/{slug}/projects`, {
    params: {
      path: {
        slug: vars.organizationSlug,
      }
    },
    body: vars.parameters,
  })

  if (error) handleError(error)
  return data
}

type ProjectCreateData = Awaited<ReturnType<typeof createProject>>

export const useProjectCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectCreateData, ResponseError, ProjectCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectCreateData, ResponseError, ProjectCreateVariables>(
    (vars) => {
      return createProject(vars)
    },
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(projectKeys.orgProjects(variables.organizationSlug))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create new project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
