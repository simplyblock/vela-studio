import { components } from '../vela/vela-schema'
import { handleError, post } from '../fetchers'
import { ResponseError } from '../../types'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { resourcesKeys } from './keys'
import { toast } from 'sonner'

interface ProjectLimitUpdateVariables {
  orgSlug: string
  projectRef: string
  limit: components['schemas']['ProvLimitPayload']
}

async function updateProjectLimit(
  { orgSlug, projectRef, limit }: ProjectLimitUpdateVariables,
  signal?: AbortSignal
) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/resources/limits',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
        },
      },
      body: limit,
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

export type ProjectLimitUpdateData = Awaited<ReturnType<typeof updateProjectLimit>>

export const useProjectLimitUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectLimitUpdateData, ResponseError, ProjectLimitUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<ProjectLimitUpdateData, ResponseError, ProjectLimitUpdateVariables>(
    (vars) => updateProjectLimit(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(
          resourcesKeys.projectLimits(variables.orgSlug, variables.projectRef)
        )
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update project limit: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
