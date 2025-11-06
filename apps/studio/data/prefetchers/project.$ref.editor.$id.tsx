import { QueryClient, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import {
  formatFilterURLParams,
  formatSortURLParams,
  loadTableEditorStateFromLocalStorage,
  parseSupaTable,
} from 'components/grid/SupabaseGrid.utils'
import { Filter, Sort } from 'components/grid/types'
import { prefetchTableEditor } from 'data/table-editor/table-editor-query'
import { prefetchTableRows } from 'data/table-rows/table-rows-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { RoleImpersonationState } from 'lib/role-impersonation'
import { useRoleImpersonationStateSnapshot } from 'state/role-impersonation-state'
import { TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE } from 'state/table-editor'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'
import { getOrganizationSlug } from '../vela/organization-path-slug'
import { getBranchRef } from '../vela/branch-path-ref'
import { useSelectedBranchQuery } from '../branches/selected-branch-query'
import { Branch } from 'data/branches/branch-query'

interface PrefetchEditorTablePageArgs {
  queryClient: QueryClient
  branch: Branch
  id: number
  sorts?: Sort[]
  filters?: Filter[]
  roleImpersonationState?: RoleImpersonationState
}

export function prefetchEditorTablePage({
  queryClient,
  branch,
  id,
  sorts,
  filters,
  roleImpersonationState,
}: PrefetchEditorTablePageArgs) {
  return prefetchTableEditor(queryClient, {
    branch,
    id,
  }).then((entity) => {
    if (entity) {
      const supaTable = parseSupaTable(entity)

      const { sorts: localSorts = [], filters: localFilters = [] } =
        loadTableEditorStateFromLocalStorage(branch.id, entity.name, entity.schema) ?? {}

      prefetchTableRows(queryClient, {
        branch,
        tableId: id,
        sorts: sorts ?? formatSortURLParams(supaTable.name, localSorts),
        filters: filters ?? formatFilterURLParams(localFilters),
        page: 1,
        limit: TABLE_EDITOR_DEFAULT_ROWS_PER_PAGE,
        roleImpersonationState,
      })
    }
  })
}

export function usePrefetchEditorTablePage() {
  const router = useRouter()
  const orgRef = getOrganizationSlug()
  const { data: branch } = useSelectedBranchQuery()
  const branchRef = getBranchRef()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const roleImpersonationState = useRoleImpersonationStateSnapshot()

  return useCallback(
    ({ id: _id, filters, sorts }: { id?: string; filters?: Filter[]; sorts?: Sort[] }) => {
      const id = _id ? Number(_id) : undefined
      if (!project || !branch || !id || isNaN(id)) return

      // Prefetch the code
      router.prefetch(`/org/${orgRef}/project/${project.id}/branch/${branchRef}/editor/${id}`)

      // Prefetch the data
      prefetchEditorTablePage({
        queryClient,
        branch,
        id,
        sorts,
        filters,
        roleImpersonationState: roleImpersonationState as RoleImpersonationState,
      }).catch(() => {
        // eat prefetching errors as they are not critical
      })
    },
    [project, queryClient, roleImpersonationState, router]
  )
}

interface EditorTablePageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  orgRef?: string
  branchRef?: string
  id?: string
  sorts?: Sort[]
  filters?: Filter[]
  href?: PrefetchableLinkProps['href']
}

export function EditorTablePageLink({
  projectRef,
  orgRef,
  branchRef,
  id,
  sorts,
  filters,
  href,
  children,
  ...props
}: PropsWithChildren<EditorTablePageLinkProps>) {
  const prefetch = usePrefetchEditorTablePage()

  return (
    <PrefetchableLink
      href={href || `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor/${id}`}
      prefetcher={() => prefetch({ id, sorts, filters })}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}
