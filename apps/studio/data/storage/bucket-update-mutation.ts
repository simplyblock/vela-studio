import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, patch } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketUpdateVariables = {
  orgRef: string
  projectRef: string
  branchRef: string
  id: string
  isPublic: boolean
  file_size_limit: number | null
  allowed_mime_types: string[] | null
}

// [Alaister]: API accept null values for allowed_mime_types and file_size_limit to reset
type UpdateStorageBucketBody = Omit<
  components['schemas']['UpdateStorageBucketBody'],
  'allowed_mime_types' | 'file_size_limit'
> & {
  allowed_mime_types: string[] | null
  file_size_limit: number | null
}

export async function updateBucket({
  orgRef,
  projectRef,
  branchRef,
  id,
  isPublic,
  file_size_limit,
  allowed_mime_types,
}: BucketUpdateVariables) {
  if (!orgRef) throw new Error('orgRef is required')
  if (!projectRef) throw new Error('projectRef is required')
  if (!branchRef) throw new Error('branchRef is required')
  if (!id) throw new Error('Bucket name is required')

  const payload: Partial<UpdateStorageBucketBody> = { public: isPublic }
  if (file_size_limit !== undefined) payload.file_size_limit = file_size_limit
  if (allowed_mime_types !== undefined) payload.allowed_mime_types = allowed_mime_types

  const { data, error } = await patch(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets/{id}',
    {
      params: {
        path: {
          id,
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      body: payload as any,
    }
  )

  if (error) handleError(error)
  return data
}

type BucketUpdateData = Awaited<ReturnType<typeof updateBucket>>

export const useBucketUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketUpdateData, ResponseError, BucketUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketUpdateData, ResponseError, BucketUpdateVariables>(
    (vars) => updateBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgRef, projectRef, branchRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(orgRef, projectRef, branchRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to update bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
