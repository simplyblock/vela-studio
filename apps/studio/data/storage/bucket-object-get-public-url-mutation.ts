import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type BucketObjectPublicUrlParams = {
  orgRef: string
  projectRef: string
  branchRef: string
  bucketId?: string
  path: string
  options?: components['schemas']['GetSignedUrlBody']['options']
}
export const getPublicUrlForBucketObject = async (
  { orgRef, projectRef, branchRef, bucketId, path, options }: BucketObjectPublicUrlParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/objects/public-url',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          id: bucketId,
        },
      },
      body: { path, options },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type BucketObjectPublicUrlData = Awaited<ReturnType<typeof getPublicUrlForBucketObject>>

export const useGetBucketObjectPublicUrlMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketObjectPublicUrlData, ResponseError, BucketObjectPublicUrlParams>,
  'mutationFn'
> = {}) => {
  return useMutation<BucketObjectPublicUrlData, ResponseError, BucketObjectPublicUrlParams>(
    (vars) => getPublicUrlForBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to get public URL of bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
