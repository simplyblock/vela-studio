import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type SignBucketObjectParams = {
  orgRef: string
  projectRef: string
  branchRef: string
  bucketId?: string
  path: string
  expiresIn: number
  options?: components['schemas']['GetSignedUrlBody']['options']
}
export const signBucketObject = async (
  { orgRef, projectRef, branchRef, bucketId, path, expiresIn, options }: SignBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/objects/sign',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          id: bucketId,
        },
      },
      body: { path, expiresIn, options },
      signal,
    }
  )

  if (error) handleError(error)
  return data
}

type SignBucketObjectData = Awaited<ReturnType<typeof signBucketObject>>

export const useGetSignBucketObjectMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<SignBucketObjectData, ResponseError, SignBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<SignBucketObjectData, ResponseError, SignBucketObjectParams>(
    (vars) => signBucketObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to get sign bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
