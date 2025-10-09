import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/router'
import { PropsWithChildren, useCallback } from 'react'

import { prefetchSchemas } from 'data/database/schemas-query'
import { ENTITY_TYPE } from 'data/entity-types/entity-type-constants'
import { prefetchEntityTypes } from 'data/entity-types/entity-types-infinite-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import PrefetchableLink, { PrefetchableLinkProps } from './PrefetchableLink'
import { useSelectedBranchQuery } from '../branches/selected-branch-query'

export function usePrefetchEditorIndexPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: branch } = useSelectedBranchQuery()

  const [entityTypesSort] = useLocalStorage<'alphabetical' | 'grouped-alphabetical'>(
    'table-editor-sort',
    'alphabetical'
  )

  return useCallback(() => {
    if (!branch) return

    // Prefetch code
    router.prefetch(`/org/${branch.organization_id}/project/${branch.project_id}/branch/${branch.id}/editor`)

    // Prefetch data
    prefetchSchemas(queryClient, {
      branch,
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
    prefetchEntityTypes(queryClient, {
      branch,
      sort: entityTypesSort,
      filterTypes: Object.values(ENTITY_TYPE),
    }).catch(() => {
      // eat prefetching errors as they are not critical
    })
  }, [entityTypesSort, branch, queryClient, router])
}

interface EditorIndexPageLinkProps extends Omit<PrefetchableLinkProps, 'href' | 'prefetcher'> {
  projectRef?: string
  orgRef: string
  branchRef?: string
  href?: PrefetchableLinkProps['href']
}

export function EditorIndexPageLink({
  href,
  projectRef,
  orgRef,
  branchRef,
  children,
  ...props
}: PropsWithChildren<EditorIndexPageLinkProps>) {
  const prefetch = usePrefetchEditorIndexPage()

  return (
    <PrefetchableLink
      href={href || `/org/${orgRef}/project/${projectRef}/branch/${branchRef}/editor`}
      prefetcher={prefetch}
      {...props}
    >
      {children}
    </PrefetchableLink>
  )
}
