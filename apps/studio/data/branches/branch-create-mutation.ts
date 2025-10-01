import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'

export type BranchCreateVariables = {
  orgSlug: string
  projectRef: string
  branchName: string
  withData?: boolean
}

export async function createBranch({
  orgSlug,
  projectRef,
  branchName,
  withData,
}: BranchCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/projects/{ref}/branches', {
    params: {
      path: {
        slug: orgSlug,
        ref: projectRef,
      },
    },
    body: {
      branch_name: branchName,
      with_data: withData,
    },
  })

  if (error) handleError(error)
  return data
}

type BranchCreateData = Awaited<ReturnType<typeof createBranch>>

export const useBranchCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BranchCreateData, ResponseError, BranchCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<BranchCreateData, ResponseError, BranchCreateVariables>(
    (vars) => createBranch(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgSlug, projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(orgSlug, projectRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create branch: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
