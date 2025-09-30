import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchUpdateVariables = {
  orgSlug: string
  projectRef: string
  branch: string
}

export async function updateBranch({
  orgSlug,
  projectRef,
  branch,
}: BranchUpdateVariables) {
  const { data, error } = await patch('/platform/organizations/{slug}/projects/{ref}/branches/{branch}', {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef,
        branch: branch
      },
    },
    body: {
      branch_name: branch,
    },
  })

  if (error) handleError(error)
  return data
}

type BranchUpdateData = Awaited<ReturnType<typeof updateBranch>>

export const useBranchUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchUpdateData, ResponseError, BranchUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchUpdateData, ResponseError, BranchUpdateVariables>(
    (vars) => updateBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(orgSlug, projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
