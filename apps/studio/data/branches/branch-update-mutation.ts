import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, put } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchUpdateVariables = {
  orgRef: string
  projectRef: string
  branch: string
}

export async function updateBranch({ orgRef, projectRef, branch }: BranchUpdateVariables) {
  const { data, error } = await put(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branch,
        },
      },
      body: {
        name: branch,
      },
    }
  )

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
        const { orgRef, projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(orgRef, projectRef))
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
