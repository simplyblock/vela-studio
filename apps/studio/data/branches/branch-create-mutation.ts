import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { branchKeys } from './keys'
import { components } from '../vela/vela-schema'

export type BranchCreateVariables = {
  orgRef: string
  projectRef: string
  branchRef?: string
  branchName: string
  withData?: boolean
  withConfig?: boolean
  envType?: string
  deployment?: components['schemas']['DeploymentParameters']
}

export async function createBranch({
  orgRef,
  projectRef,
  branchRef,
  branchName,
  withData,
  withConfig,
  deployment,
  envType,
}: BranchCreateVariables) {
  const { data, error } = await post('/platform/organizations/{slug}/projects/{ref}/branches', {
    params: {
      path: {
        slug: orgRef,
        ref: projectRef,
      },
    },
    body: {
      name: branchName,
      env_type: envType,
      source: branchRef
        ? {
            branch_id: branchRef,
            config_copy: withConfig,
            copy_data: withData,
            deployment_parameters: deployment
              ? {
                  milli_vcpu: deployment.milli_vcpu,
                  memory_bytes: deployment.memory_bytes,
                  iops: deployment.iops,
                  database_size: deployment.database_size,
                  storage_size: deployment.storage_size,
                  enable_file_storage: deployment.enable_file_storage,
                }
              : undefined,
          }
        : undefined,
      deployment: !branchRef ? deployment : undefined,
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
        const { orgRef, projectRef } = variables
        await queryClient.invalidateQueries(branchKeys.list(orgRef, projectRef))
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
