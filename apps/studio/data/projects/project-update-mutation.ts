import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'
import { getPathReferences } from '../vela/path-references'

export type ProjectUpdateVariables = {
  orgRef: string
  ref: string
  name: string
}

export type ProjectUpdateResponse = {
  id: number
  ref: string
  name: string
}

export async function updateProject({ orgRef, ref, name }: ProjectUpdateVariables) {
  const { data, error } = await patch('/platform/organizations/{slug}/projects/{ref}', {
    params: {
      path: {
        slug: orgRef,
        ref,
      },
    },
    body: { name },
  })
  if (error) handleError(error)
  return data
}

type ProjectUpdateData = Awaited<ReturnType<typeof updateProject>>

export const useProjectUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectUpdateData, ResponseError, ProjectUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  const { slug } = getPathReferences()

  return useMutation<ProjectUpdateData, ResponseError, ProjectUpdateVariables>(
    (vars) => updateProject(vars),
    {
      async onSuccess(data, variables, context) {
        const { ref } = variables
        await Promise.all([
          queryClient.invalidateQueries(projectKeys.list()),
          queryClient.invalidateQueries(projectKeys.detail(slug as string, ref)),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
