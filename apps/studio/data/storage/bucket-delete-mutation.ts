import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { BucketType } from './buckets-query'
import { storageKeys } from './keys'

export type BucketDeleteVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  id: string
  type: BucketType
}

export async function deleteBucket({
  orgRef,
  projectRef,
  branchRef,
  id,
  type,
}: BucketDeleteVariables) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')
  if (!id) throw new Error('Bucket name is required')

  const { data, error: deleteBucketError } = await del(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          id,
        },
        query: {
          type,
        },
      },
    } as any
  )
  if (deleteBucketError) handleError(deleteBucketError)
  return data
}

type BucketDeleteData = Awaited<ReturnType<typeof deleteBucket>>

export const useBucketDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketDeleteData, ResponseError, BucketDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketDeleteData, ResponseError, BucketDeleteVariables>(
    (vars) => deleteBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgRef, projectRef, branchRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(orgRef, projectRef, branchRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to delete bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
