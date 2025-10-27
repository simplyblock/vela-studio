import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { WrapperMeta } from 'components/interfaces/Integrations/Wrappers/Wrappers.types'
import { entityTypeKeys } from 'data/entity-types/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { executeSql } from 'data/sql/execute-sql-query'
import { wrapWithTransaction } from 'data/sql/utils/transaction'
import { vaultSecretsKeys } from 'data/vault/keys'
import type { ResponseError } from 'types'
import { getCreateFDWSql } from './fdw-create-mutation'
import { getDeleteFDWSql } from './fdw-delete-mutation'
import { FDW } from './fdws-query'
import { fdwKeys } from './keys'
import { Branch } from 'data/branches/branch-query'

export type FDWUpdateVariables = {
  branch?: Branch
  wrapper: FDW
  wrapperMeta: WrapperMeta
  formState: {
    [k: string]: string
  }
  tables: any[]
}

export const getUpdateFDWSql = ({
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: Pick<FDWUpdateVariables, 'wrapper' | 'wrapperMeta' | 'formState' | 'tables'>) => {
  const deleteWrapperSql = getDeleteFDWSql({ wrapper, wrapperMeta })
  const createWrapperSql = getCreateFDWSql({
    wrapperMeta,
    formState,
    tables,
    mode: 'tables',
    sourceSchema: '',
    targetSchema: '',
  })

  const sql = /* SQL */ `
    ${deleteWrapperSql}

    ${createWrapperSql}
  `

  return sql
}

export async function updateFDW({
  branch,
  wrapper,
  wrapperMeta,
  formState,
  tables,
}: FDWUpdateVariables) {
  const sql = wrapWithTransaction(getUpdateFDWSql({ wrapper, wrapperMeta, formState, tables }))
  const { result } = await executeSql({ branch, sql })
  return result
}

type FDWUpdateData = Awaited<ReturnType<typeof updateFDW>>

export const useFDWUpdateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<FDWUpdateData, ResponseError, FDWUpdateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<FDWUpdateData, ResponseError, FDWUpdateVariables>((vars) => updateFDW(vars), {
    async onSuccess(data, variables, context) {
      const { branch } = variables

      await Promise.all([
        queryClient.invalidateQueries(
          fdwKeys.list(branch?.organization_id, branch?.project_id, branch?.id),
          { refetchType: 'all' }
        ),
        queryClient.invalidateQueries(
          entityTypeKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        ),
        queryClient.invalidateQueries(
          foreignTableKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        ),
        queryClient.invalidateQueries(
          vaultSecretsKeys.list(branch?.organization_id, branch?.project_id, branch?.id)
        ),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(
          `Failed to update ${variables.wrapper.name} foreign data wrapper: ${data.message}`
        )
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
