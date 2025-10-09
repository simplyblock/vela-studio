import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { components } from 'api-types'
import { handleError, post } from 'data/fetchers'
import type { ResponseError } from 'types'
import { lintKeys } from './keys'
import { Branch } from 'api-types/types'

type ExceptionPayload = components['schemas']['CreateNotificationExceptionsBody']['exceptions'][0]

export type LintRuleCreateVariables = {
  branch: Branch
  exception: ExceptionPayload
}

export async function createLintRule({ branch, exception }: LintRuleCreateVariables) {
  const { data, error } = await post('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: {
      path: {
        ref: branch.project_id,
      },
    },
    body: {
      exceptions: [exception],
    },
  })

  if (error) handleError(error)
  return data
}

type LintRuleCreateData = Awaited<ReturnType<typeof createLintRule>>

export const useLintRuleCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LintRuleCreateData, ResponseError, LintRuleCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<LintRuleCreateData, ResponseError, LintRuleCreateVariables>(
    (vars) => createLintRule(vars),
    {
      async onSuccess(data, variables, context) {
        const { branch } = variables
        await Promise.all([
          queryClient.invalidateQueries(
            lintKeys.lintRules(branch.organization_id, branch.project_id, branch.id)
          ),
          queryClient.invalidateQueries(
            lintKeys.lint(branch.organization_id, branch.project_id, branch.id)
          ),
        ])
        await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create lint rule: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
