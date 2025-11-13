import { useMutation, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import { ResponseError } from 'types'

type NewFolderObjectParams = {
  orgRef: string
  projectRef: string
  branchRef: string
  bucketId?: string
  path: string
}
export const newFolderObject = async ({
  orgRef,
  projectRef,
  branchRef,
  bucketId,
  path,
}: NewFolderObjectParams) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}/objects/new-folder',
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
        path,
      },
    }
  )

  if (error) handleError(error)
  return data
}

type NewFolderObjectData = Awaited<ReturnType<typeof newFolderObject>>

export const useBucketObjectNewFolderMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<NewFolderObjectData, ResponseError, NewFolderObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<NewFolderObjectData, ResponseError, NewFolderObjectParams>(
    (vars) => newFolderObject(vars),
    {
      async onSuccess(data, variables, context) {
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create new folder bucket object: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
