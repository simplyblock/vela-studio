import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BranchesData } from './branches-query'
import { branchKeys } from './keys'

export type BranchDeleteVariables = {
  orgSlug: string
  projectRef: string
  branch: string
}

export async function deleteBranch({ orgSlug, projectRef, branch }: BranchDeleteVariables) {
  const { data, error } = await del(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}',
    {
      params: {
        path: {
          slug: orgSlug,
          ref: projectRef,
          branch: branch,
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

type BranchDeleteData = Awaited<ReturnType<typeof deleteBranch>>

export const useBranchDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchDeleteData, ResponseError, BranchDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchDeleteData, ResponseError, BranchDeleteVariables>(
    (vars) => deleteBranch(vars),
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
