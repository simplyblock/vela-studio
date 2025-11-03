import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { storageKeys } from './keys'

export type BucketCreateVariables = Omit<CreateStorageBucketBody, 'public'> & {
  orgRef: string
  projectRef: string
  branchRef: string
  isPublic: boolean
}

type CreateStorageBucketBody = components['schemas']['CreateStorageBucketBody']

export async function createBucket({
  orgRef,
  projectRef,
  branchRef,
  id,
  isPublic,
}: BucketCreateVariables) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('Bucket name is required')

  const payload: CreateStorageBucketBody = { id, public: isPublic }
  const { data, error } = await post(
    '/platform/organizations/{slug}/projects/{ref}/branches/{branch}/storage/buckets',
    {
      params: {
        path: {
          slug: orgRef,
          ref: projectRef,
          branch: branchRef,
        },
      },
      body: payload,
    }
  )

  if (error) handleError(error)
  return data as { name: string }
}

type BucketCreateData = Awaited<ReturnType<typeof createBucket>>

export const useBucketCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<BucketCreateData, ResponseError, BucketCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<BucketCreateData, ResponseError, BucketCreateVariables>(
    (vars) => createBucket(vars),
    {
      async onSuccess(data, variables, context) {
        const { orgRef, projectRef, branchRef } = variables
        await queryClient.invalidateQueries(storageKeys.buckets(orgRef, projectRef, branchRef))
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create bucket: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
