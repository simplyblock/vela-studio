import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketEmptyVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  id: string
}

export async function emptyBucket({ orgRef, projectRef, branchRef, id }: BucketEmptyVariables) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/empty',
    {
      params: {
        path: {
          id,
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
    }
  )

  if (error) handleError(error)
  return data
}

type BucketEmptyData = Awaited<ReturnType<typeof emptyBucket>>

export const useBucketEmptyMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketEmptyData, ResponseError, BucketEmptyVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketEmptyData, ResponseError, BucketEmptyVariables>(
    (vars) => emptyBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgRef, projectRef, branchRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(orgRef, projectRef, branchRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to empty bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
