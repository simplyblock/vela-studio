import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { del, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { lintKeys } from './keys'
import { Branch } from 'api-types/types'

export type LintRuleDeleteVariables = {
  branch: Branch
  ids: string[]
}

export async function deleteLintRule({ branch, ids }: LintRuleDeleteVariables) {
  const { data, error } = await del('/platform/projects/{ref}/notifications/advisor/exceptions', {
    params: {
      path: {
        ref: branch.project_id,
      },
      query: { ids },
    },
  })

  if (error) handleError(error)
  return data
}

type LintRuleDeleteData = Awaited<ReturnType<typeof deleteLintRule>>

export const useLintRuleDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<LintRuleDeleteData, ResponseError, LintRuleDeleteVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()
  return useMutation<LintRuleDeleteData, ResponseError, LintRuleDeleteVariables>(
    (vars) => deleteLintRule(vars),
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
          toast.error(`Failed to delete lint rule: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
