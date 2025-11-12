import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type DownloadBucketObjectParams = {
  orgRef: string
  projectRef: string
  branchRef: string
  bucketId?: string
  path: string
  options?: components['schemas']['DownloadObjectBody']['options']
}
export const downloadBucketObject = async (
  { orgRef, projectRef, branchRef, bucketId, path, options }: DownloadBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post(
    `/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/objects/download`,
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          id: bucketId,
        }
      },
      body: {
        path,
        options,
      },
      abortSignal: signal,
    }
  )

  if (error) handleError(error)
  return data
}

type BucketObjectDeleteData = Awaited<ReturnType<typeof downloadBucketObject>>

export const useBucketObjectDownloadMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketObjectDeleteData, ResponseError, DownloadBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<BucketObjectDeleteData, ResponseError, DownloadBucketObjectParams>(
    (vars) => downloadBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to download bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
