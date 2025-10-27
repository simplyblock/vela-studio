import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BranchesData } from './branches-query'
import { branchKeys } from './keys'
import { components } from '../vela/vela-schema'

export type BranchResizeVariables = {
  orgSlug: string
  projectRef: string
  branch: string
  parameters: components['schemas']['ResizeParameters']
}

export async function resizeBranch({
  orgSlug,
  projectRef,
  branch,
  parameters,
}: BranchResizeVariables) {
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/resize',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
          branch: branch,
        },
      },
      body: parameters,
    }
  )

  if (error) handleError(error)
  return data
}

type BranchResizeData = Awaited<ReturnType<typeof resizeBranch>>

export const useBranchResizeMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchResizeData, ResponseError, BranchResizeVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchResizeData, ResponseError, BranchResizeVariables>(
    (vars) => resizeBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef, branch } = variables
        setTimeout(() => {
          queryClient.invalidateQueries(branchKeys.list(orgSlug, projectRef))
        }, 5000)

        const branches: BranchesData | undefined = queryClient.getQueryData(
          branchKeys.list(orgSlug, projectRef)
        )
        if (branches) {
          const updatedBranches = branches.filter((branch) => branch.name !== variables.branch)
          queryClient.setQueryData(branchKeys.list(orgSlug, projectRef), updatedBranches)
        }

        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
