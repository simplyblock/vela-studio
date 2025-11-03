import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type MoveStorageObjectParams = {
  orgRef: string
  projectRef: string
  branchRef: string
  bucketId?: string
  from: string
  to: string
}
export const moveStorageObject = async ({
  orgRef,
  projectRef,
  branchRef,
  bucketId,
  from,
  to,
}: MoveStorageObjectParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/objects/move',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
          id: bucketId,
        },
      },
      body: {
        from,
        to,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type MoveBucketObjectData = Awaited<ReturnType<typeof moveStorageObject>>

export const useBucketObjectMoveMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<MoveBucketObjectData, ResponseError, MoveStorageObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<MoveBucketObjectData, ResponseError, MoveStorageObjectParams>(
    (vars) => moveStorageObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to move bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
